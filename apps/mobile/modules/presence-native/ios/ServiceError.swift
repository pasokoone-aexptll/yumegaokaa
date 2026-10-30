import Foundation
struct ServiceError: LocalizedError {
 let code: String
 var errorDescription: String? { code }
}
