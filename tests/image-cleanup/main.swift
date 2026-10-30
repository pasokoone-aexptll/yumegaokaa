import Foundation
let fm = FileManager.default
let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString)
try fm.createDirectory(at: root, withIntermediateDirectories: true)
defer { try? fm.removeItem(at: root) }
for directory in ["ImagePicker", "ImageManipulator", "Documents", "ImagePickerBackup"] {
  let url = root.appendingPathComponent(directory)
  try fm.createDirectory(at: url, withIntermediateDirectories: true)
  try Data([1,2,3]).write(to: url.appendingPathComponent("image.jpg"))
}
let original = root.appendingPathComponent("Documents/image.jpg")
try fm.createSymbolicLink(at: root.appendingPathComponent("ImagePicker/original.jpg"), withDestinationURL: original)
TemporaryImageCleanup.removePreviousCopies(in: root)
for directory in ["ImagePicker", "ImageManipulator"] {
  precondition(!fm.fileExists(atPath: root.appendingPathComponent(directory+"/image.jpg").path))
}
precondition(fm.fileExists(atPath: original.path))
precondition(fm.fileExists(atPath: root.appendingPathComponent("ImagePickerBackup/image.jpg").path))
try fm.removeItem(at: root.appendingPathComponent("ImageManipulator"))
try fm.createSymbolicLink(at: root.appendingPathComponent("ImageManipulator"), withDestinationURL: root.appendingPathComponent("Documents"))
TemporaryImageCleanup.removePreviousCopies(in: root)
precondition(fm.fileExists(atPath: original.path))
print("Temporary copies removed; original, unrelated directory, and symlink targets preserved; repeat cleanup succeeded.")
let cache = URLCache(memoryCapacity: 1024*1024, diskCapacity: 0, diskPath: nil)
let request = URLRequest(url: URL(string: "https://example.invalid/storage/v1/image")!)
let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Cache-Control":"max-age=3600"])!
let cached = CachedURLResponse(response: response, data: Data([1,2,3]))
cache.storeCachedResponse(cached, for: request)
precondition(cache.cachedResponse(for: request) != nil)
PrivateHTTPCache.disable(cache)
precondition(cache.cachedResponse(for: request) == nil)
cache.storeCachedResponse(cached, for: request)
precondition(cache.cachedResponse(for: request) == nil)
precondition(cache.memoryCapacity == 0 && cache.diskCapacity == 0)
print("HTTP cache: old response removed and new storage rejected.")
