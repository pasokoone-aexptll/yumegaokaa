import Foundation

var passed = 0
func check(_ condition: Bool, _ name: String) {
    guard condition else { fatalError("FAIL: \(name)") }
    passed += 1
    print("PASS: \(name)")
}
let start = Date(timeIntervalSince1970: 1_800_000_000)
var state = PresenceState()
let token = state.begin(now: start)
func sample(_ cell: String, _ seconds: Double, _ revision: Int) -> PresenceState.Sample {
    .init(cell: cell, observedAt: start.addingTimeInterval(seconds), revision: revision)
}
check(state.receive(token: token, sample: sample("A", 1, 1), inside: true, now: start.addingTimeInterval(1)) == .accepted, "initial sample")
let deadline = state.visitExpiresAt
check(state.receive(token: token, sample: sample("A", 1, 1), inside: true, now: start.addingTimeInterval(30)) == .duplicateOrOld, "retry rejected")
check(state.visitExpiresAt == deadline, "retry cannot extend visit")
check(state.receive(token: UUID(), sample: sample("B", 40, 2), inside: true, now: start.addingTimeInterval(40)) == .invalidToken, "wrong token")
check(state.receive(token: token, sample: sample("B", 50, 2), inside: true, now: start.addingTimeInterval(50)) == .accepted, "move replaces sample")
check(state.cell == "B" && state.visibleCount(now: start.addingTimeInterval(50)) == 1, "one visit one presence after moving")
check(state.visitExpiresAt == start.addingTimeInterval(50 + 10800), "fresh background sample renews visit")
check(state.receive(token: token, sample: sample("A", 20, 1), inside: true, now: start.addingTimeInterval(51)) == .duplicateOrOld, "out of order cannot move backwards")
check(state.receive(token: token, sample: sample("C", 51, 3), inside: true, now: start.addingTimeInterval(200)) == .stale, "delayed observation rejected")
check(state.receive(token: token, sample: sample("C", 300, 3), inside: true, now: start.addingTimeInterval(201)) == .stale, "future timestamp rejected")
check(state.visibleCount(now: start.addingTimeInterval(650)) == 0 && state.isActive(now: start.addingTimeInterval(650)), "presence expires at 10 minutes independently of visit")
check(state.receive(token: token, sample: sample("C", 700, 3), inside: true, now: start.addingTimeInterval(700)) == .accepted, "fresh sample restores presence while visit active")
state.end()
check(state.receive(token: token, sample: sample("D", 701, 4), inside: true, now: start.addingTimeInterval(701)) == .inactive, "late update cannot resurrect manual exit")
let newToken = state.begin(now: start.addingTimeInterval(800))
check(state.receive(token: token, sample: sample("D", 801, 1), inside: true, now: start.addingTimeInterval(801)) == .invalidToken, "old visit token rejected after re-entry")
check(state.receive(token: newToken, sample: sample("D", 11600, 1), inside: true, now: start.addingTimeInterval(11600)) == .inactive, "expired visit cannot renew")
let lastToken = state.begin(now: start.addingTimeInterval(12000))
check(state.receive(token: lastToken, sample: sample("OUT", 12001, 1), inside: false, now: start.addingTimeInterval(12001)) == .outside, "outside terminates visit")
check(!state.isActive(now: start.addingTimeInterval(12001)), "outside clears state")
print("\(passed) checks passed. Model tests only; no background or network verification.")
