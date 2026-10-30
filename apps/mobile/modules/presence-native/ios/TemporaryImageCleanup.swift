import Foundation

// Run once before the UI can start an image selection. Never run on foreground
// resume: an in-flight picker/upload may still own these files.
enum TemporaryImageCleanup {
  private static let startup: Void = {
    guard let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first else { return }
    removePreviousCopies(in: root)
  }()

  static func prepareOnce() { _ = startup }

  static func removePreviousCopies(in root: URL) {
    let manager = FileManager.default
    for name in ["ImagePicker", "ImageManipulator"] {
      let directory = root.appendingPathComponent(name, isDirectory: true)
      guard let attributes = try? manager.attributesOfItem(atPath: directory.path),
            attributes[.type] as? FileAttributeType == .typeDirectory,
            let files = try? manager.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil) else { continue }
      for file in files {
        guard let attributes = try? manager.attributesOfItem(atPath: file.path),
              attributes[.type] as? FileAttributeType == .typeRegular else { continue }
        // Failed cleanup must not prevent login. Retry on the next cold start.
        try? manager.removeItem(at: file)
      }
    }
  }
}
