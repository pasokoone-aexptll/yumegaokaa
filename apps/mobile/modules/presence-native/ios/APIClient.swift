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
 private func request(path:String,body:[String:Any],bearer:String?=nil,method:String="POST") async throws -> [String:Any] {
  guard !base.isEmpty,let url=URL(string:base+path) else {throw ServiceError(code:"not_configured")}
  var req=URLRequest(url:url);req.httpMethod=method;req.timeoutInterval=12
  req.setValue("application/json",forHTTPHeaderField:"Content-Type");req.setValue(key,forHTTPHeaderField:"apikey")
  if let bearer { req.setValue("Bearer "+bearer,forHTTPHeaderField:"Authorization") }
  if method != "GET" {req.httpBody=try JSONSerialization.data(withJSONObject:body)}
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
  var body:[String:Any]=["email":email,"token":code,"type":"email"]
  if code.hasPrefix("https://") {
   guard let link=URLComponents(string:code), link.scheme=="https", link.host==URL(string:base)?.host,
         link.port==nil,link.user==nil,link.password==nil,link.path=="/auth/v1/verify",
         let hash=link.queryItems?.first(where:{$0.name=="token"})?.value,!hash.isEmpty,
         let type=link.queryItems?.first(where:{$0.name=="type"})?.value,["signup","magiclink","email"].contains(type)
   else {throw ServiceError(code:"invalid_input")}
   body=["token_hash":hash,"type":type]
  }
  let r=try await request(path:"/auth/v1/verify",body:body)
  guard generation==authGeneration,let identity=r["user"] as? [String:Any],
        let actual=identity["email"] as? String,actual.caseInsensitiveCompare(email) == .orderedSame,
        r["access_token"] is String else{throw ServiceError(code:"login_required")}
  try save(r);return session()
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
 func mfaFactors() async throws -> [String:Any] {
  let bearer=try await token();let generation=authGeneration
  let user=try await request(path:"/auth/v1/user",body:[:],bearer:bearer,method:"GET")
  guard generation==authGeneration else{throw ServiceError(code:"login_required")}
  return ["factors":user["factors"] ?? []]
 }
 func mfaEnroll() async throws -> [String:Any] {
  let bearer=try await token();let generation=authGeneration
  let result=try await request(path:"/auth/v1/factors",body:["factor_type":"totp","friendly_name":"Yumegaoka operator"],bearer:bearer)
  guard generation==authGeneration else{throw ServiceError(code:"login_required")};return result
 }
 func mfaVerify(factor:String,code:String) async throws {
  guard UUID(uuidString:factor) != nil else{throw ServiceError(code:"invalid_input")}
  let bearer=try await token();let generation=authGeneration
  let challenge=try await request(path:"/auth/v1/factors/"+factor+"/challenge",body:[:],bearer:bearer)
  guard generation==authGeneration,let id=challenge["id"] as? String else{throw ServiceError(code:"login_required")}
  var result=try await request(path:"/auth/v1/factors/"+factor+"/verify",body:["challenge_id":id,"code":code],bearer:bearer)
  guard generation==authGeneration else{throw ServiceError(code:"login_required")}
  if let seconds=result["expires_in"] as? Double {result["expires_at"]=Date().timeIntervalSince1970+seconds}
  authGeneration+=1;refreshing?.cancel();refreshing=nil
  try save(result)
 }
 func accountDetails() async throws -> [String:Any] {
  let generation=authGeneration;let bearer=try await token()
  let user=try await request(path:"/auth/v1/user",body:[:],bearer:bearer,method:"GET")
  guard generation==authGeneration else{throw ServiceError(code:"login_required")}
  var updated=credentials;updated["user"]=user;try save(updated)
  return ["email":user["email"] ?? "", "new_email":user["new_email"] ?? ""]
 }
 func changeEmail(_ email:String) async throws {
  let generation=authGeneration;let bearer=try await token()
  _ = try await request(path:"/auth/v1/user",body:["email":email],bearer:bearer,method:"PUT")
  guard generation==authGeneration else{throw ServiceError(code:"login_required")}
 }
 func verifyEmailChange(email:String,code:String) async throws -> [String:Any] {
  let generation=authGeneration
  let expectedUser=(credentials["user"] as? [String:Any])?["id"] as? String
  let result=try await request(path:"/auth/v1/verify",body:["email":email,"token":code,"type":"email_change"])
  guard generation==authGeneration else{throw ServiceError(code:"login_required")}
  if result["access_token"] != nil {
   guard let user=result["user"] as? [String:Any],user["id"] as? String==expectedUser else{throw ServiceError(code:"unauthorized")}
   authGeneration+=1;refreshing?.cancel();refreshing=nil;try save(result)
   return ["complete":true]
  }
  return ["complete":false]
 }
 func pushRegistration(_ operation:String,_ payload:[String:Any]=[:]) async throws -> [String:Any] {
  let generation=authGeneration
  let bearer=try await token()
  guard generation==authGeneration else {throw ServiceError(code:"login_required")}
  let result=try await request(path:"/rest/v1/rpc/push_registration",body:["operation":operation,"payload":payload],bearer:bearer)
  guard generation==authGeneration else {throw ServiceError(code:"login_required")}
  return result
 }
 func realtimeToken() async throws -> String {try await token()}
 func logout() async {
  authGeneration+=1;refreshing?.cancel();refreshing=nil
  let oldToken=credentials["access_token"] as? String
  SecItemDelete(keychainQuery as CFDictionary);credentials=[:]
  if let oldToken {
   _ = try? await request(path:"/rest/v1/rpc/push_registration",body:["operation":"remove","payload":[:]],bearer:oldToken)
   _ = try? await request(path:"/auth/v1/logout?scope=local",body:[:],bearer:oldToken)
  }
 }
}
