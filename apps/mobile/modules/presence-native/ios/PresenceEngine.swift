import Foundation
import CoreLocation
import UIKit
import Network
import Darwin

@MainActor final class PresenceEngine: NSObject, @preconcurrency CLLocationManagerDelegate {
 static let shared = PresenceEngine()
 private let manager=CLLocationManager(), api=APIClient.shared
 private let network=NWPathMonitor()
 private var resuming=false, entering=false, stopRequested=false
 private var lifecycle:VisitLifecycle?, lifecycleScope:String?
 private var visit:[String:Any]? { lifecycle?.visit }
 private var config:[String:Any]?, processing=false, enabled=false
 private var generation=0, lastCell:String?, lastSent:Double?, lastObserved:Date?
 private var outside=OutsideConfirmation(), clockServer:Double?, clockMono:Double=0, uncertainty:Double=0
 private var wallBase=Date().timeIntervalSince1970, monoBase=0.0, startedWall=Date()
 private var status="未参加"
 private var foregroundObserver:NSObjectProtocol?
 private var recoveryTask:Task<Void,Never>?
 var onChange:(([String:Any])->Void)?

 private static let formatter:ISO8601DateFormatter = {let f=ISO8601DateFormatter();f.formatOptions=[.withInternetDateTime,.withFractionalSeconds];return f}()
 static func date(_ value:Any?) -> Date? {
  guard let s=value as? String else{return nil}
  return formatter.date(from:s) ?? ISO8601DateFormatter().date(from:s)
 }
 nonisolated static func mono() -> Double { var info=mach_timebase_info_data_t();mach_timebase_info(&info);return Double(mach_continuous_time())*Double(info.numer)/Double(info.denom)/1e9 }
 override private init(){
  super.init();manager.delegate=self;manager.desiredAccuracy=kCLLocationAccuracyNearestTenMeters
  manager.distanceFilter=kCLDistanceFilterNone;manager.pausesLocationUpdatesAutomatically=false
  manager.activityType = .other;manager.allowsBackgroundLocationUpdates=true;manager.showsBackgroundLocationIndicator=true
  monoBase=Self.mono()
  network.pathUpdateHandler = { [weak self] path in
   if path.status == .satisfied { Task { @MainActor in await self?.resume() } }
  }
  network.start(queue:DispatchQueue(label:"yumegaoka.network"))
  foregroundObserver=NotificationCenter.default.addObserver(forName:UIApplication.didBecomeActiveNotification,object:nil,queue:.main){[weak self] _ in
   Task{@MainActor in await self?.resume()}
  }
 }
 private func emit(_ message:String?=nil){if let message {status=message};onChange?(state())}
 func state()->[String:Any]{["observing":enabled,"status":status,"visit":visit ?? [:],"pending_exit":lifecycle?.intent.stopping ?? false]}
 private func prepareLifecycle() async throws -> VisitLifecycle {
  let scope=try await api.lifecycleScope()
  if scope != lifecycleScope {
   if lifecycleScope != nil {stopRequested=false}
   clearObservation()
   let journal=try VisitJournal(scope:scope)
   let created=VisitLifecycle(intent:try journal.load(),save:{try journal.save($0)},rpc:{[api] op,payload in try await api.rpc(op,payload)})
   created.changed = { [weak self] in
    guard let self else{return}
    self.emit(self.stopRequested && self.lifecycle?.busy == false && self.lifecycle?.intent.stopping == false ? "未参加" : nil)
   }
   lifecycle=created;lifecycleScope=scope
  }
  return lifecycle!
 }
 private func scheduleRecovery() {
  guard recoveryTask==nil else{return}
  recoveryTask=Task { [weak self] in
   var delay:UInt64=5
   while !Task.isCancelled {
    try? await Task.sleep(nanoseconds:delay*1_000_000_000)
    guard !Task.isCancelled,let self else{return}
    await self.resume()
    if self.lifecycle?.intent.stopping != true && self.lifecycle?.intent.attempt == nil {break}
    delay=min(30,delay*2)
   }
   self?.recoveryTask=nil
  }
 }
 private func clearObservation(){enabled=false;generation+=1;manager.stopUpdatingLocation();outside.reset();lastCell=nil;lastSent=nil;lastObserved=nil}
 private func start(){
  guard !stopRequested,visit?["can_update"] as? Bool==true,lifecycle?.intent.stopping != true else{return}
  enabled=true;startedWall=Date();wallBase=Date().timeIntervalSince1970;monoBase=Self.mono()
  manager.requestAlwaysAuthorization();manager.startUpdatingLocation();emit("気配を観測中")
 }
 func syncClock() async throws {
  var best:(Double,Double,Double)?
  for _ in 0..<3 {
   let m0=Self.mono();let r=try await api.rpc("time");let m1=Self.mono(),rtt=m1-m0
   if rtt<=2,let d=Self.date(r["server_time"]),best==nil || rtt<best!.2 {best=(d.timeIntervalSince1970+rtt/2,m1,rtt)}
  }
  guard let best else{throw ServiceError(code:"clock_sync_failed")}
  clockServer=best.0;clockMono=best.1;uncertainty=best.2/2
  wallBase=Date().timeIntervalSince1970;monoBase=Self.mono();outside.reset()
 }
 private func serverNow()->Double?{clockServer.map{$0+Self.mono()-clockMono}}
 func checkin(tagID:String) async throws -> [String:Any] {
  guard !entering else {throw ServiceError(code:"operation_in_progress")}
  entering=true;defer{entering=false}
  guard ![.denied,.restricted].contains(manager.authorizationStatus) else {throw ServiceError(code:"location_permission_required")}
  if manager.authorizationStatus == .notDetermined {
   manager.requestWhenInUseAuthorization()
   throw ServiceError(code:"location_permission_required")
  }
  stopRequested=false
  let life=try await prepareLifecycle()
  guard !stopRequested else {throw ServiceError(code:"canceled")}
  guard !life.busy else {throw ServiceError(code:"operation_in_progress")}
  clearObservation();let ticket=generation
  try await syncClock()
  guard ticket==generation else {throw ServiceError(code:"canceled")}
  do {try await life.checkin(tag:tagID)} catch {scheduleRecovery();throw error}
  guard ticket==generation,!life.intent.stopping else {return state()}
  if let street=visit?["street_id"] as? String {config=try await api.rpc("get_street_config",["street_id":street])}
  if ticket==generation {start()}
  return state()
 }
 func stop() async throws -> [String:Any] {
  stopRequested=true;clearObservation();emit("退出を反映中")
  // Initialize the journal before OFF, including immediately after relaunch.
  let life:VisitLifecycle
  if let existing=lifecycle {life=existing} else {life=try await prepareLifecycle()}
  do {try await life.stop();if life.intent.stopping {scheduleRecovery()};emit(life.intent.stopping ? "退出は通信回復後に反映します" : "未参加")}
  catch {scheduleRecovery();emit("観測は停止しました。退出は通信回復後に反映します");throw error}
  return state()
 }
 func resume() async {
  guard !resuming,!entering else{return};resuming=true;defer{resuming=false}
  do {
   let life=try await prepareLifecycle()
   guard !life.busy else{return}
   if stopRequested && !life.intent.stopping {try await life.stop();emit("未参加");return}
   let ticket=generation
   try await life.resume()
   guard ticket==generation else{return}
   guard !life.intent.stopping else{clearObservation();emit("退出は通信回復後に反映します");return}
   guard let v=visit,v["state"] as? String=="active" else{clearObservation();emit("未参加");return}
   guard v["can_update"] as? Bool==true else{clearObservation();emit("別の端末で参加中");return}
   config=try await api.rpc("get_street_config",["street_id":v["street_id"]!]);try await syncClock()
   if ticket==generation {start()}
  }catch{
   if lifecycle?.intent.stopping == true || lifecycle?.intent.attempt != nil {scheduleRecovery()}
   emit("通信を確認してください。気配の期限は延長されません")
  }
 }
 func locationManagerDidChangeAuthorization(_ manager:CLLocationManager){
  if [.denied,.restricted].contains(manager.authorizationStatus){manager.stopUpdatingLocation();outside.reset();emit("位置情報が許可されていません。街への参加は期限まで有効です")}
 }
 func locationManager(_ manager:CLLocationManager,didFailWithError error:Error){outside.reset();emit("測位待ち。新しい気配はまだ送っていません")}
 func locationManager(_ manager:CLLocationManager,didUpdateLocations locations:[CLLocation]){
  guard enabled,!processing,let location=locations.last else{return}
  processing=true;let ticket=generation
  let bg=UIApplication.shared.beginBackgroundTask(withName:"presence-observation")
  Task {defer{processing=false;if bg != .invalid {UIApplication.shared.endBackgroundTask(bg)}}
   await observe(location,ticket:ticket)
  }
 }
 private func observe(_ location:CLLocation,ticket:Int) async {
  let mono=Self.mono(),wall=Date().timeIntervalSince1970,age=wall-location.timestamp.timeIntervalSince1970
  guard CLLocationCoordinate2DIsValid(location.coordinate),location.timestamp>=startedWall,location.horizontalAccuracy.isFinite,location.horizontalAccuracy>=0,location.horizontalAccuracy<=50,age>=0,age+uncertainty<=120,lastObserved==nil || location.timestamp>lastObserved! else{outside.reset();return}
  if abs((wall-wallBase)-(mono-monoBase))>2 {clockServer=nil;outside.reset();startedWall=Date();try? await syncClock();return}
  do {
   if clockServer==nil || mono-clockMono>900 {try await syncClock()}
   guard enabled,ticket==generation,let v=visit,let street=v["street_id"] as? String else{return}
   // Always classify against the current published boundary before sending.
   let latest=try await api.rpc("get_street_config",["street_id":street])
   guard enabled,ticket==generation else{return}
   if latest["area_version"] as? String != config?["area_version"] as? String {outside.reset();lastCell=nil}
   config=latest
   guard let rings=(latest["polygon"] as? [String:Any])?["coordinates"] as? [[[Double]]],let ring=rings.first,let now=serverNow() else{return}
   guard Self.mono()-mono+age+uncertainty<=120 else{outside.reset();return}
   let p=Grid.project(longitude:location.coordinate.longitude,latitude:location.coordinate.latitude)
   let polygon=ring.compactMap{q -> Point? in q.count>=2 ? Point(x:q[0],y:q[1]):nil}
   guard p.x.isFinite,p.y.isFinite else{outside.reset();return}
   let d=Grid.signedDistance(p,polygon:polygon),a=location.horizontalAccuracy
   var verdict="inside",cell:String?=nil
   if d>a {
    outside.reset()
    if let lastSent,mono-lastSent>=600 {lastCell=nil}
    cell=Grid.cell(p,previous:lastCell)
    if let lastSent,mono-lastSent<30 || (cell==lastCell && mono-lastSent<180) {return}
   }else if d < -a {
    guard outside.observe(time:mono-age) else{return};verdict="outside"
   }else{outside.reset();return}
   if let expiry=Self.date(v["expires_at"]),expiry.timeIntervalSince1970<=now {clearObservation();emit("参加期限が切れました。再参加にはNFCが必要です");return}
   guard let life=lifecycle else{return}
   let lifeTicket=life.generation
   let sequence=try life.nextSequence()
   var body:[String:Any]=["visit_id":v["visit_id"]!,"seq":String(sequence),"area_version":latest["area_version"]!,"observed_at":Self.formatter.string(from:Date(timeIntervalSince1970:now-(Self.mono()-mono)-age)),"horizontal_accuracy_m":a,"verdict":verdict]
   if let cell {body["cell_id"]=cell;body["grid_version"]=latest["grid_version"]}
   let r=try await api.rpc("observe_visit",body)
   guard enabled,ticket==generation else{return}
   try life.observation(r,ticket:lifeTicket);lastObserved=location.timestamp
   if r["result"] as? String=="ended" {clearObservation();emit("街から退出しました")}
   else if r["result"] as? String=="accepted" {lastCell=cell;lastSent=mono;emit("新しい気配を共有しました")}
  }catch let e as ServiceError {
   if ["inactive_visit","wrong_writer","membership_required","unauthorized","login_required"].contains(e.code){clearObservation();emit("参加状態を確認してください")}
   else{outside.reset();emit("更新待ち。古い気配は期限で消えます")}
  }catch{outside.reset();emit("通信待ち。古い気配は期限で消えます")}
 }
}
