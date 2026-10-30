import Foundation
var checks=0
func check(_ value:Bool,_ name:String){checks+=1;if !value{fatalError(name)}}
let vectors=try JSONSerialization.jsonObject(with:Data(contentsOf:URL(fileURLWithPath:"tests/native/vectors.json"))) as! [[String:Any]]
for v in vectors {let p=Grid.project(longitude:v["lon"] as! Double,latitude:v["lat"] as! Double),e=v["expected"] as! [Double];check(abs(p.x-e[0])<=0.01 && abs(p.y-e[1])<=0.01,"PROJ4投影比較")}
for (x,expected) in [(-0.01,"-1:0"),(0.0,"0:0"),(99.99,"0:0"),(100,"1:0")] {check(Grid.cell(Point(x:x,y:0),previous:nil)==expected,"負座標・半開区間")}
check(Grid.cell(Point(x:119.99,y:50),previous:"0:0")=="0:0","20m保持")
check(Grid.cell(Point(x:120,y:50),previous:"0:0")=="1:0","20m切替")
check(Grid.cell(Point(x:350,y:50),previous:"0:0")=="3:0","飛越し")
let polygon=[Point(x:0,y:0),Point(x:100,y:0),Point(x:100,y:100),Point(x:0,y:100)]
check(Grid.signedDistance(Point(x:50,y:50),polygon:polygon)==50,"街内")
check(Grid.signedDistance(Point(x:110,y:50),polygon:polygon)==(-10),"街外")
var outside=OutsideConfirmation()
check(!outside.observe(time:0),"初回")
check(!outside.observe(time:29),"29秒")
check(outside.observe(time:30),"30秒")
outside.reset();check(!outside.observe(time:0),"reset");check(outside.observe(time:120),"120秒")
outside.reset();_ = outside.observe(time:0);check(!outside.observe(time:121),"121秒でリセット")
print("観測計算 \(checks) assertions passed")
