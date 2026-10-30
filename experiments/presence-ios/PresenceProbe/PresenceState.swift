import Foundation

// In-memory server model for this experiment; NOT a production auth/backend.
struct PresenceState {
    struct Sample {
        let cell: String
        let observedAt: Date
        let revision: Int
    }
    enum Result: String { case accepted, duplicateOrOld, stale, invalidToken, inactive, outside }
    private(set) var token: UUID?
    private(set) var visitExpiresAt: Date?
    private(set) var presenceExpiresAt: Date?
    private(set) var cell: String?
    private(set) var revision = 0
    private(set) var lastObservation: Date?
    static let visitTTL: TimeInterval = 3 * 60 * 60
    static let presenceTTL: TimeInterval = 10 * 60
    // Experiment values, not approved product thresholds.
    static let maxSampleAge: TimeInterval = 120

    mutating func begin(now: Date) -> UUID {
        let value = UUID()
        token = value
        visitExpiresAt = now.addingTimeInterval(Self.visitTTL)
        presenceExpiresAt = nil
        cell = nil
        revision = 0
        lastObservation = nil
        return value
    }

    mutating func end() {
        token = nil
        visitExpiresAt = nil
        presenceExpiresAt = nil
        cell = nil
    }

    func isActive(now: Date) -> Bool {
        token != nil && (visitExpiresAt.map { now < $0 } ?? false)
    }

    func visibleCount(now: Date) -> Int {
        isActive(now: now) && cell != nil &&
        (presenceExpiresAt.map { now < $0 } ?? false) ? 1 : 0
    }

    mutating func receive(token supplied: UUID, sample: Sample,
                          inside: Bool, now: Date) -> Result {
        guard isActive(now: now) else { return .inactive }
        guard supplied == token else { return .invalidToken }
        guard sample.revision > revision else { return .duplicateOrOld }
        guard sample.observedAt <= now,
              now.timeIntervalSince(sample.observedAt) <= Self.maxSampleAge,
              lastObservation.map({ sample.observedAt > $0 }) ?? true else { return .stale }
        guard inside else { end(); return .outside }
        revision = sample.revision
        lastObservation = sample.observedAt
        cell = sample.cell // Replace, never append.
        visitExpiresAt = now.addingTimeInterval(Self.visitTTL)
        presenceExpiresAt = min(sample.observedAt.addingTimeInterval(Self.presenceTTL),
                                visitExpiresAt!)
        return .accepted
    }
}
