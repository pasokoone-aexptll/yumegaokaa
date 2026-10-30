import Foundation

struct Point: Codable, Equatable { let x: Double; let y: Double }
/// WGS84 transverse Mercator, fixed internal grid. Inputs longitude then latitude.
enum Grid {
 static func project(longitude: Double, latitude: Double) -> Point {
  let a = 6378137.0, f = 1.0 / 298.257223563, k = 0.9999
  let e2 = f * (2-f), ep = e2 / (1-e2)
  let phi = latitude * .pi / 180, lambda = (longitude - 139.8333333333333) * .pi / 180
  func meridian(_ p: Double) -> Double {
   let e4=e2*e2, e6=e2*e2*e2
   let c0=1-e2/4-3*e4/64-5*e6/256
   let c2=3*e2/8+3*e4/32+45*e6/1024
   let c4=15*e4/256+45*e6/1024
   let c6=35*e6/3072
   return a * (c0*p - c2*sin(2*p) + c4*sin(4*p) - c6*sin(6*p))
  }
  let n = a / sqrt(1-e2*pow(sin(phi),2)), t = pow(tan(phi),2), c = ep*pow(cos(phi),2), aa = cos(phi)*lambda
  let e = k*n*(aa+(1-t+c)*pow(aa,3)/6+(5-18*t+t*t+72*c-58*ep)*pow(aa,5)/120)
  let north = k*(meridian(phi)-meridian(36 * .pi/180)+n*tan(phi)*(aa*aa/2+(5-t+9*c+4*c*c)*pow(aa,4)/24+(61-58*t+t*t+600*c-330*ep)*pow(aa,6)/720))
  return Point(x:(e*100).rounded(.toNearestOrAwayFromZero)/100,y:(north*100).rounded(.toNearestOrAwayFromZero)/100)
 }
 static func cell(_ p: Point, previous: String?) -> String {
  if let previous { let q = previous.split(separator: ":").compactMap{Double($0)}
   if q.count==2 && p.x>q[0]*100-20 && p.x<q[0]*100+120 && p.y>q[1]*100-20 && p.y<q[1]*100+120 { return previous }
  }
  return "\(Int(floor(p.x/100))):\(Int(floor(p.y/100)))"
 }
 static func signedDistance(_ p: Point, polygon: [Point]) -> Double {
  guard polygon.count>=3 else { return .nan }
  var inside=false, distance=Double.infinity
  for i in polygon.indices {
   let a=polygon[i], b=polygon[(i+1)%polygon.count], dx=b.x-a.x, dy=b.y-a.y
   let length=dx*dx+dy*dy
   let u=length>0 ? max(0,min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)) : 0
   distance=min(distance,hypot(p.x-a.x-u*dx,p.y-a.y-u*dy))
   if (a.y>p.y) != (b.y>p.y) && p.x < (b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x { inside.toggle() }
  }
  return inside ? distance : -distance
 }
}
struct OutsideConfirmation {
 var first: Double?
 mutating func reset(){ first=nil }
 mutating func observe(time: Double) -> Bool {
  guard let first, time>=first, time-first<=120 else { self.first=time;return false }
  return time-first>=30
 }
}
