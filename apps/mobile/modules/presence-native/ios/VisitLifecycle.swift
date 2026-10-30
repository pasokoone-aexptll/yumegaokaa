import Foundation

// Persist intent before network I/O. This journal contains IDs/sequence only, never location.
struct VisitIntent: Codable {
 var attempt: String?
 var visit: String?
 var sequence: Int64 = 0
 var stopping = false
}
@MainActor final class VisitLifecycle {
 typealias RPC = (String, [String:Any]) async throws -> [String:Any]
 private let rpc: RPC
 private let save: (VisitIntent) throws -> Void
 private(set) var intent: VisitIntent
 private(set) var visit: [String:Any]?
 private(set) var generation = 0
 private(set) var busy = false
 var changed: (() -> Void)?
 init(intent: VisitIntent, save: @escaping (VisitIntent) throws -> Void, rpc: @escaping RPC) {
  self.intent=intent; self.save=save; self.rpc=rpc
 }
 private func write(_ next: VisitIntent) throws { try save(next); intent=next; changed?() }
 private func finish() async {
  // stop() can interrupt any await; no other start/resume may overtake its cleanup.
  if intent.stopping { try? await flushStop() }
  busy=false; changed?()
 }
 private func valid(_ ticket: Int) -> Bool { ticket==generation && !intent.stopping }
 func checkin(tag: String) async throws {
  guard !busy else { throw ServiceError(code:"operation_in_progress") }
  busy=true
  do {
   let ticket=generation
   if intent.stopping { try await flushStop() }
   guard ticket==generation else {throw ServiceError(code:"canceled")}
   // Resolve a previous uncertain commit before accepting a new input.
   if intent.attempt != nil { try await recoverAttempt() }
   guard valid(ticket) else {throw ServiceError(code:"canceled")}
   let a=try await rpc("prepare_checkin",["tag_id":tag,"payload_version":1])
   guard let id=a["attempt_id"] as? String else { throw ServiceError(code:"invalid_response") }
   var next=intent; next.attempt=id; try write(next)
   guard valid(ticket) else { throw ServiceError(code:"canceled") }
   let r=try await rpc("commit_checkin",["attempt_id":id])
   guard valid(ticket) else { throw ServiceError(code:"canceled") }
   try accept(r)
   await finish()
  } catch { await finish(); throw error }
 }
 private func recoverAttempt() async throws {
  guard let id=intent.attempt else { return }
  let ticket=generation
  do {
   var r=try await rpc("get_checkin_result",["attempt_id":id])
   guard valid(ticket) else { return }
   if r["result"] as? String == "pending" {
    r=try await rpc("commit_checkin",["attempt_id":id])
    guard valid(ticket) else { return }
   }
   try accept(r)
  } catch let e as ServiceError where ["not_found","attempt_expired","conflict","tag_changed"].contains(e.code) {
   guard valid(ticket) else { return }
   var next=intent; next.attempt=nil; try write(next)
  }
 }
 private func accept(_ result: [String:Any]) throws {
  let v=result["visit"] as? [String:Any]
  var next=intent; next.attempt=nil
  if let v, v["state"] as? String=="active", v["can_update"] as? Bool==true, let id=v["visit_id"] as? String {
   if next.visit != id { next.sequence=0 }
   next.visit=id
   next.sequence=max(next.sequence,Int64(v["last_seq"] as? String ?? "0") ?? 0)
  } else { next.visit=nil; next.sequence=0 }
  try write(next); visit=v; changed?()
 }
 func resume() async throws {
  guard !busy else { return }
  busy=true
  do {
   if intent.stopping { try await flushStop(); busy=false; return }
   let ticket=generation
   try await recoverAttempt()
   guard valid(ticket) else { await finish(); return }
   let r=try await rpc("get_my_visit",[:])
   guard valid(ticket) else { await finish(); return }
   try accept(r)
   await finish()
  } catch { await finish(); throw error }
 }
 func stop() async throws {
  generation+=1
  var next=intent; next.stopping=true
  // Retain OFF even if disk fails; caller also stops Core Location synchronously.
  intent=next; visit=nil; changed?(); try save(next)
  if busy { return }
  busy=true
  do { try await flushStop(); busy=false } catch { busy=false; throw error }
 }
 private func flushStop() async throws {
  if let id=intent.attempt {
   do { _ = try await rpc("cancel_checkin",["attempt_id":id]) }
   catch let e as ServiceError where e.code=="not_found" { /* Expired journal already removed. */ }
  }
  if let id=intent.visit {
   do { _ = try await rpc("end_visit",["visit_id":id,"reason":"manual"]) }
   catch let e as ServiceError where ["not_found","wrong_writer"].contains(e.code) { }
  }
  try write(VisitIntent()); visit=nil; changed?()
 }
 func nextSequence() throws -> Int64 {
  guard !intent.stopping, intent.visit != nil else { throw ServiceError(code:"inactive_visit") }
  var next=intent; next.sequence+=1; try write(next); return next.sequence
 }
 func observation(_ result:[String:Any], ticket:Int) throws {
  guard valid(ticket) else { return }
  // A response from an old visit must never overwrite a newer visit.
  guard let v=result["visit"] as? [String:Any],v["visit_id"] as? String==intent.visit else{return}
  try accept(result)
 }
}

// Atomic replacement survives process termination; file protection permits background use
// after the first unlock. The scope is the backend plus authenticated session, not a device ID.
struct VisitJournal {
 let file: URL
 init(scope: String, directory: URL? = nil) throws {
  let root=try directory ?? FileManager.default.url(for:.applicationSupportDirectory,in:.userDomainMask,appropriateFor:nil,create:true).appendingPathComponent("VisitIntent",isDirectory:true)
  try FileManager.default.createDirectory(at:root,withIntermediateDirectories:true)
  // scope is a filesystem-safe SHA256 of backend URL and authenticated session ID.
  file=root.appendingPathComponent(scope+".json")
 }
 func load() throws -> VisitIntent {
  guard FileManager.default.fileExists(atPath:file.path) else{return VisitIntent()}
  return try JSONDecoder().decode(VisitIntent.self,from:Data(contentsOf:file))
 }
 func save(_ intent: VisitIntent) throws {
  let data=try JSONEncoder().encode(intent)
  #if os(iOS)
  try data.write(to:file,options:[.atomic,.completeFileProtectionUntilFirstUserAuthentication])
  #else
  try data.write(to:file,options:.atomic)
  #endif
 }
}
