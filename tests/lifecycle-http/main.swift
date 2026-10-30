import Foundation

@MainActor final class Transport {
 let env=ProcessInfo.processInfo.environment
 var offline=false, lose:String?
 func rpc(_ op:String,_ body:[String:Any]) async throws -> [String:Any] {
  if offline {throw URLError(.notConnectedToInternet)}
  var req=URLRequest(url:URL(string:env["TEST_API"]!+"/rest/v1/rpc/street_api")!)
  req.httpMethod="POST";req.setValue(env["TEST_KEY"]!,forHTTPHeaderField:"apikey")
  req.setValue("Bearer "+env["TEST_TOKEN"]!,forHTTPHeaderField:"Authorization")
  req.setValue("application/json",forHTTPHeaderField:"Content-Type")
  req.httpBody=try JSONSerialization.data(withJSONObject:["operation":op,"payload":body])
  let (data,response)=try await URLSession.shared.data(for:req)
  let json=try JSONSerialization.jsonObject(with:data) as! [String:Any]
  guard (response as! HTTPURLResponse).statusCode==200 else {throw ServiceError(code:json["message"] as? String ?? "error")}
  if lose==op {lose=nil;throw URLError(.timedOut)}
  return json
 }
}
@main struct Test {
 @MainActor static func main() async throws {
  let wire=Transport(),street=wire.env["TEST_STREET"]!,tag=wire.env["TEST_TAG"]!
  let root=FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
  defer{try? FileManager.default.removeItem(at:root)}
  let journal=try VisitJournal(scope:"integration",directory:root)
  func client()throws->VisitLifecycle {VisitLifecycle(intent:try journal.load(),save:{try journal.save($0)},rpc:{try await wire.rpc($0,$1)})}
  func map()async throws->[String:Any]{try await wire.rpc("get_presence_snapshot",["street_id":street])}
  var life=try client();wire.lose="commit_checkin"
  do{try await life.checkin(tag:tag);fatalError("expected lost response")}catch is URLError{}
  life=try client();try await life.resume()
  let joined=try await map();precondition(joined["checked_in_count"] as? Int == 1)
  let v=life.intent.visit!
  func observation(_ sequence:Int64,_ cell:String)->[String:Any] {
   ["visit_id":v,"seq":String(sequence),"area_version":"1","grid_version":"1","cell_id":cell,"verdict":"inside","horizontal_accuracy_m":10,"observed_at":ISO8601DateFormatter().string(from:Date().addingTimeInterval(-1))]
  }
  let a=observation(try life.nextSequence(),"0:0")
  wire.lose="observe_visit"
  do{_ = try await wire.rpc("observe_visit",a);fatalError()}catch is URLError{}
  let original=try await wire.rpc("get_my_visit",[:])["visit"] as! [String:Any]
  let replay=try await wire.rpc("observe_visit",a)
  precondition(replay["result"] as? String=="ignored")
  precondition((replay["visit"] as! [String:Any])["expires_at"] as? String==original["expires_at"] as? String)
  // Restart with a request already accepted remotely. New sequence > old sequence.
  life=try client();try await life.resume()
  var b=observation(try life.nextSequence(),"1:0")
  b["observed_at"]=ISO8601DateFormatter().string(from:Date().addingTimeInterval(1))
  let accepted=try await wire.rpc("observe_visit",b)
  try life.observation(accepted,ticket:life.generation)
  let moved=try await map()
  precondition(moved["presence_count"] as? Int==1)
  precondition((moved["cells"] as! [[String:Any]]).first?["cell_id"] as? String=="1:0")
  wire.offline=true
  do{try await life.stop();fatalError()}catch is URLError{}
  life=try client();precondition(life.intent.stopping)
  wire.offline=false;try await life.resume()
  let ended=try await map()
  precondition(ended["presence_count"] as? Int==0 && ended["checked_in_count"] as? Int==0)
  do{_ = try await wire.rpc("observe_visit",b);fatalError("revival")}catch let e as ServiceError{precondition(e.code=="inactive_visit")}
  print("Swift本体状態管理 + 実HTTP/DB: commit応答紛失→再起動→更新応答紛失/再送→移動置換→通信断OFF→再起動/復帰→遅延更新拒否 PASS")
 }
}
