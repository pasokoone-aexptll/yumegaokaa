# Compile the production delegate method with minimal collaborators.
# This checks handler behavior, not Core Location delivery timing on a device.
from pathlib import Path
import subprocess,tempfile
source=Path('apps/mobile/modules/presence-native/ios/PresenceEngine.swift').read_text()
start=source.index('func locationManager(_ manager:CLLocationManager,didFailWithError')
end=source.index('\n func locationManager(',start+1)
method=source[start:end]
fixture='''import Foundation
final class CLLocationManager {}
struct Outside { var resets = 0; mutating func reset() { resets += 1 } }
final class Engine {
 var enabled = false
 var outside = Outside()
 var messages: [String] = []
 func emit(_ value: String) { messages.append(value) }
 METHOD
}
let engine = Engine()
let manager = CLLocationManager()
let error = NSError(domain: "test", code: 1)
engine.locationManager(manager, didFailWithError: error)
precondition(engine.messages.isEmpty && engine.outside.resets == 0, "Stopped observation was overwritten")
engine.enabled = true
engine.locationManager(manager, didFailWithError: error)
precondition(engine.messages.count == 1 && engine.outside.resets == 1, "Active failure was suppressed")
engine.enabled = false
engine.locationManager(manager, didFailWithError: error)
precondition(engine.messages.count == 1 && engine.outside.resets == 1, "Queued failure after stop changed state")
print("PASS: disabled / active / stopped-after-active")
'''
with tempfile.TemporaryDirectory(prefix='location-failure-') as directory:
 for name,body in [('fixed',method),('regression',method.replace('guard enabled else{return}',''))]:
  path=Path(directory)/'main.swift';path.write_text(fixture.replace('METHOD',body))
  binary=Path(directory)/name
  subprocess.run(['swiftc','-module-cache-path','/tmp/yumegaoka-swift-cache',str(path),'-o',str(binary)],check=True)
  result=subprocess.run([str(binary)],capture_output=True,text=True)
  if name=='fixed':
   assert result.returncode==0,result.stderr
   print(result.stdout.strip())
  else:
   assert result.returncode!=0,'Regression was not detected'
   print('PASS: removing the guard reproduces stopped-state assertion failure')
