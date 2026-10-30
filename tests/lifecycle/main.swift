import Foundation

@MainActor final class FakeServer {
 var active=false, creates=0, ends=0, offline=false, loseCommit=false
 var hold:String?, gate:CheckedContinuation<Void,Never>?, entered=false
 var lastSeq:Int64=0
 func view()->[String:Any] {["visit_id":"v1","street_id":"s1","state":active ? "active":"ended","can_update":active,"last_seq":String(lastSeq),"expires_at":"2099-01-01T00:00:00Z"]}
 func rpc(_ op:String,_ body:[String:Any]) async throws -> [String:Any] {
  if offline {throw ServiceError(code:"offline")}
  let captured=active
  if op==hold {entered=true;await withCheckedContinuation{gate=$0};hold=nil}
  switch op {
  case "prepare_checkin":return ["attempt_id":"a1"]
  case "commit_checkin":if !active {active=true;creates+=1};if loseCommit {loseCommit=false;throw ServiceError(code:"offline")};return ["visit":view()]
  case "get_checkin_result":return ["result":active ? "committed":"pending","visit":view()]
  case "get_my_visit":return captured ? ["visit":view()]:[:]
  case "end_visit","cancel_checkin":active=false;ends+=1;return [:]
  default:return [:]
  }
 }
}
@main struct Tests {
 @MainActor static func main() async throws {
  let root=FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
  defer {try? FileManager.default.removeItem(at:root)}
  var checks=0
  func expect(_ ok:Bool,_ message:String){precondition(ok,message);checks+=1}
  func create(_ server:FakeServer,_ journal:VisitJournal)throws->VisitLifecycle {
   VisitLifecycle(intent:try journal.load(),save:{try journal.save($0)},rpc:{try await server.rpc($0,$1)})
  }
  // Commit succeeds remotely, response is lost; reboot recovers the same visit.
  let server=FakeServer(),j=try VisitJournal(scope:"test",directory:root)
  var life=try create(server,j);server.loseCommit=true
  do {try await life.checkin(tag:"tag");fatalError()}catch{}
  expect(try j.load().attempt != nil,"uncertain commit must be journaled")
  life=try create(server,j);try await life.resume()
  expect(server.creates==1 && life.intent.visit=="v1","restart must not create a second visit")
  let seq=try life.nextSequence();life=try create(server,j);try await life.resume()
  expect(try life.nextSequence()==seq+1,"restart cannot reuse sent sequence even if response lost")
  // Offline OFF persists before request, survives process restart, flushes before resume.
  server.offline=true
  do {try await life.stop();fatalError()}catch{}
  expect(try j.load().stopping,"OFF persisted before network")
  life=try create(server,j)
  expect(life.intent.stopping && life.visit==nil,"relaunch remains OFF")
  server.offline=false;try await life.resume()
  expect(!server.active && life.visit==nil && !life.intent.stopping,"reconnect finishes OFF")
  // Late response arriving after OFF cannot restore an active visit.
  try await life.checkin(tag:"tag");let ticket=life.generation;let old=server.view()
  try await life.stop();try life.observation(["visit":old],ticket:ticket)
  expect(life.visit==nil,"late observation cannot revive OFF")
  // OFF during prepare, before we even know the attempt ID.
  server.hold="prepare_checkin";server.entered=false
  let current=life
  let task=Task {try? await current.checkin(tag:"tag")}
  while !server.entered {await Task.yield()}
  try await life.stop();expect(life.intent.stopping,"stop while prepare blocked")
  server.gate?.resume();await task.value
  expect(!server.active && life.intent.attempt==nil,"late prepare canceled, never committed")
  // OFF while get_my_visit response is in flight.
  try await life.checkin(tag:"tag");server.hold="get_my_visit";server.entered=false
  let resume=Task {try? await current.resume()}
  while !server.entered {await Task.yield()}
  try await life.stop();server.gate?.resume();await resume.value
  expect(!server.active && life.visit==nil,"late recovery cannot erase OFF")
  // New session journal does not inherit the previous session's writer/intent.
  let other=try VisitJournal(scope:"other",directory:root)
  expect(try other.load().visit==nil,"session journals isolated")
  // Failed storage must prevent a request sequence from being sent.
  let bad=VisitLifecycle(intent:VisitIntent(visit:"v1"),save:{_ in throw ServiceError(code:"disk")},rpc:{try await server.rpc($0,$1)})
  do {_ = try bad.nextSequence();fatalError()}catch{}
  expect(bad.intent.sequence==0,"failed durable write cannot advance sequence")
  print("VisitLifecycle: \(checks) assertions passed (production coordinator, injected transport, atomic disk journal)")
 }
}
