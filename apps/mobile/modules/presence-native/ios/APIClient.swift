import Foundation
import Security
import CryptoKit

actor APIClient {
 static let shared = APIClient()
 private var base = "", key = ""
 private var credentials: [String:Any] = [:]
 private var authGeneration=0
 private var refreshing: Task<[String:Any],Error>?
 private var keychainQuery: [String:Any] = [kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:"yumegaoka.auth",kSecAttrAccount as String:"session"]
 func configure(url: String, key: String) throws {
  guard let u=URL(string:url),u.host != nil,["http","https"].contains(u.scheme ?? "") else {throw ServiceError(code:"invalid_url")}
  authGeneration+=1;refreshing?.cancel();refreshing=nil
  self.base=url.trimmingCharacters(in:CharacterSet(charactersIn:"/"));self.key=key
  keychainQuery[kSecAttrAccount as String]=self.base;credentials=[:]
  var q=keychainQuery;q[kSecReturnData as String]=true
  var item:CFTypeRef?
  if SecItemCopyMatching(q as CFDictionary,&item)==errSecSuccess,let data=item as? Data,let saved=try? JSONSerialization.jsonObject(with:data) as? [String:Any] {credentials=saved}
 }
 private func save(_ value:[String:Any]) throws {
  let data=try JSONSerialization.data(withJSONObject:value)
  let updates:[String:Any]=[kSecValueData as String:data,kSecAttrAccessible as String:kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly]
  var status=SecItemUpdate(keychainQuery as CFDictionary,updates as CFDictionary)
  if status==errSecItemNotFound {status=SecItemAdd(keychainQuery.merging(updates){_,b in b} as CFDictionary,nil)}
  guard status==errSecSuccess else {
   NSLog("Yumegaoka credential storage failed: OSStatus %d",status)
   throw ServiceError(code:"credential_storage_failed")
  }
  credentials=value
 }
 private func request(path:String,body:[String:Any],bearer:String?=nil) async throws -> [String:Any] {
  guard !base.isEmpty,let url=URL(string:base+path) else {throw ServiceError(code:"not_configured")}
  var req=URLRequest(url:url);req.httpMethod="POST";req.timeoutInterval=12
  req.setValue("application/json",forHTTPHeaderField:"Content-Type");req.setValue(key,forHTTPHeaderField:"apikey")
  if let bearer { req.setValue("Bearer "+bearer,forHTTPHeaderField:"Authorization") }
  req.httpBody=try JSONSerialization.data(withJSONObject:body)
  let (data,response)=try await URLSession.shared.data(for:req)
  let json=(try? JSONSerialization.jsonObject(with:data)) as? [String:Any] ?? [:]
  guard let http=response as? HTTPURLResponse,(200..<300).contains(http.statusCode) else {
   // Only allow known short server errors across the bridge; never log HTTP bodies.
   let raw=json["message"] as? String ?? json["error_code"] as? String ?? "request_failed"
   let safe=raw.range(of:"^[a-z_]{1,60}$",options:.regularExpression) != nil ? raw : "request_failed"
   throw ServiceError(code:safe)
  }
  return json
 }
 func sendOTP(email:String) async throws { _ = try await request(path:"/auth/v1/otp",body:["email":email,"create_user":true]) }
 func verifyOTP(email:String,code:String) async throws -> [String:Any] {
  authGeneration+=1;let generation=authGeneration
  let r=try await request(path:"/auth/v1/verify",body:["email":email,"token":code,"type":"email"]);guard generation==authGeneration else{throw ServiceError(code:"login_required")};try save(r);return session()
 }
 func lifecycleScope() throws -> String {
  guard let token=credentials["access_token"] as? String else { throw ServiceError(code:"login_required") }
  let parts=token.split(separator:".")
  guard parts.count==3 else { throw ServiceError(code:"login_required") }
  var encoded=String(parts[1]).replacingOccurrences(of:"-",with:"+").replacingOccurrences(of:"_",with:"/")
  encoded += String(repeating:"=",count:(4-encoded.count%4)%4)
  guard let data=Data(base64Encoded:encoded),let payload=try JSONSerialization.jsonObject(with:data) as? [String:Any],let sid=payload["session_id"] as? String,UUID(uuidString:sid) != nil else { throw ServiceError(code:"login_required") }
  // Used only for local journal isolation; server verifies JWT/session on every operation.
  return SHA256.hash(data:Data((base+"|"+sid).utf8)).map{String(format:"%02x",$0)}.joined()
 }
 func session() -> [String:Any] { ["signed_in":credentials["access_token"] != nil,"email":(credentials["user"] as? [String:Any])?["email"] ?? ""] }
 private func token() async throws -> String {
  guard let token=credentials["access_token"] as? String else {throw ServiceError(code:"login_required")}
  if let expiry=credentials["expires_at"] as? Double,expiry>Date().timeIntervalSince1970+60 {return token}
  if let refreshing {let generation=authGeneration;let r=try await refreshing.value;guard generation==authGeneration,let token=r["access_token"] as? String else{throw ServiceError(code:"login_required")};return token}
  guard let refresh=credentials["refresh_token"] as? String else {throw ServiceError(code:"login_required")}
  let generation=authGeneration
  let task=Task {try await self.request(path:"/auth/v1/token?grant_type=refresh_token",body:["refresh_token":refresh])};refreshing=task
  defer {if generation==authGeneration {refreshing=nil}}
  let r=try await task.value;guard generation==authGeneration else{throw ServiceError(code:"login_required")};try save(r)
  guard let newToken=r["access_token"] as? String else {throw ServiceError(code:"login_required")};return newToken
 }
 func rpc(_ operation:String,_ payload:[String:Any]=[:]) async throws -> [String:Any] {
  let generation=authGeneration
  let bearer=try await token()
  guard generation==authGeneration else {throw ServiceError(code:"login_required")}
  let result=try await request(path:"/rest/v1/rpc/street_api",body:["operation":operation,"payload":payload],bearer:bearer)
  guard generation==authGeneration else {throw ServiceError(code:"login_required")}
  return result
 }
 func realtimeToken() async throws -> String {try await token()}
 func logout() async {
  authGeneration+=1;refreshing?.cancel();refreshing=nil
  let oldToken=credentials["access_token"] as? String
  SecItemDelete(keychainQuery as CFDictionary);credentials=[:]
  if let oldToken { _ = try? await request(path:"/auth/v1/logout?scope=local",body:[:],bearer:oldToken) }
 }
}
