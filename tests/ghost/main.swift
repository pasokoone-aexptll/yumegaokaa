import Foundation

@MainActor final class ModeServer {
 var ghost=false, revision=0, offline=false, loseReply=false, writes=0
 var lastRequest:String?
 var holdReply=false
 var gate:CheckedContinuation<Void,Never>?
 func view()->[String:Any] { ["visit_id":"visit", "street_id":"street", "state":"active", "can_update":true, "last_seq":"0", "ghost":ghost, "mode_revision":String(revision)] }
 func response()->[String:Any] { ["visit":view(), "ghost_preference":ghost, "mode_revision":String(revision)] }
 func rpc(_ operation:String,_ body:[String:Any]) async throws -> [String:Any] {
  if offline {throw ServiceError(code:"offline")}
  if operation=="get_my_visit" {return response()}
  precondition(operation=="set_presence_mode")
  if body["request_id"] as? String == lastRequest {return response()}
  guard body["mode_revision"] as? String == String(revision) else {throw ServiceError(code:"conflict")}
  if body["ghost"] as? Bool == false {precondition(body["verdict"] as? String == "inside")}
  ghost=body["ghost"] as! Bool; revision+=1; writes+=1; lastRequest=body["request_id"] as? String
  if holdReply {holdReply=false;await withCheckedContinuation {gate=$0}}
  if loseReply {loseReply=false;throw ServiceError(code:"offline")}
  return response()
 }
}
@main struct GhostTests {
 @MainActor static func main() async throws {
  let server=ModeServer()
  var saved=VisitIntent()
  func make()->VisitLifecycle {VisitLifecycle(intent:saved,save:{saved=$0},rpc:{try await server.rpc($0,$1)})}
  var life=make();try await life.resume()
  server.offline=true
  do {try await life.setGhost(true);fatalError("offline must fail")} catch {}
  precondition(saved.mode?.ghost == true && saved.ghostPreference == false)
  life=make();server.offline=false;server.loseReply=true
  do {try await life.resume();fatalError("lost reply must fail")} catch {}
  precondition(saved.mode != nil && server.ghost)
  life=make();try await life.resume()
  precondition(saved.mode == nil && saved.ghostPreference == true && server.writes==1)
  try await life.setGhost(false)
  precondition(saved.mode?.ghost == false && server.ghost && server.writes==1)
  try await life.resume()
  precondition(server.ghost, "resume alone must not publish")
  try await life.publishWithObservation(["verdict":"inside"])
  precondition(!server.ghost && saved.mode == nil)
  // A stale observation response captured before hiding must not undo local mode.
  let oldTicket=life.generation, old=server.response()
  try await life.setGhost(true)
  try life.observation(old,ticket:oldTicket)
  precondition(life.visit?["ghost"] as? Bool == true)
  try await life.setGhost(false)
  server.revision+=1 // Another accepted privacy choice wins; never rebase publication.
  do {try await life.publishWithObservation(["verdict":"inside"]);fatalError("conflict must fail")} catch {}
  precondition(server.ghost && saved.mode == nil)
  try await life.resume()
  try await life.setGhost(false)
  server.holdReply=true
  let current=life
  let publishing=Task {try await current.publishWithObservation(["verdict":"inside"])}
  while server.gate == nil {await Task.yield()}
  try await life.setGhost(true)
  server.gate?.resume();server.gate=nil
  try await publishing.value
  precondition(saved.mode?.ghost == true, "late publish response cannot erase hide intent")
  try await life.resume()
  precondition(server.ghost && saved.mode == nil)
  let oldJournal=Data("{\"sequence\":0,\"stopping\":false}".utf8)
  let decoded=try JSONDecoder().decode(VisitIntent.self,from:oldJournal)
  precondition(decoded.mode == nil)
  print("Ghost lifecycle: offline intent, lost reply/restart, fresh observation gate, stale response and conflict passed")
 }
}
