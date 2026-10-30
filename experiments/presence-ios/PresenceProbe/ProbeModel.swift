import SwiftUI
import CoreLocation
import UIKit

final class ProbeModel: NSObject, ObservableObject, CLLocationManagerDelegate {
    struct Entry: Identifiable {
        let id = UUID()
        let time: Date
        let text: String
    }
    private let manager = CLLocationManager()
    private var origin: CLLocation?
    private var token: UUID?
    private var revision = 0
    private var previousObservedAt: Date?
    private var previousCell: String?
    private var cellNames: [String: String] = [:]
    private var state = PresenceState()
    private var startBattery: Float?
    @Published var running = false
    @Published var status = "未開始"
    @Published var permission = "未確認"
    @Published var entries: [Entry] = []
    @Published var accepted = 0
    @Published var backgroundAccepted = 0
    @Published var transitions = 0
    @Published var maximumGap: TimeInterval = 0
    @Published var cellLabel = "—"
    @Published var presenceUntil: Date?
    @Published var visitUntil: Date?
    @Published var batteryDifference = "—"

    override init() {
        super.init()
        manager.delegate = self
        UIDevice.current.isBatteryMonitoringEnabled = true
        updatePermission()
    }

    func requestPermission() {
        manager.requestWhenInUseAuthorization()
    }

    func requestBackgroundPermission() {
        // Call from a user gesture after explaining background collection.
        manager.requestAlwaysAuthorization()
    }

    func start() {
        guard !running else { return }
        guard manager.authorizationStatus == .authorizedAlways ||
              manager.authorizationStatus == .authorizedWhenInUse else {
            status = "先に位置情報の許可を設定してください"
            return
        }
        state = PresenceState()
        token = state.begin(now: Date())
        revision = 0
        origin = nil
        previousObservedAt = nil
        previousCell = nil
        cellNames = [:]
        entries = []
        accepted = 0
        backgroundAccepted = 0
        transitions = 0
        maximumGap = 0
        cellLabel = "—"
        startBattery = UIDevice.current.batteryLevel
        batteryDifference = "—"
        // Starting values for field comparison, not an update timing guarantee.
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        manager.distanceFilter = 50
        manager.activityType = .other
        manager.pausesLocationUpdatesAutomatically = false
        manager.allowsBackgroundLocationUpdates = true
        manager.showsBackgroundLocationIndicator = true
        running = true
        visitUntil = state.visitExpiresAt
        presenceUntil = nil
        status = "検証中：100m区画・模擬サーバー・通信なし"
        add("開始：背景位置取得。画面ロックとアプリ強制終了は別条件")
        manager.startUpdatingLocation()
    }

    func stop() {
        if let previousObservedAt { maximumGap = max(maximumGap, Date().timeIntervalSince(previousObservedAt)) }
        manager.stopUpdatingLocation()
        manager.allowsBackgroundLocationUpdates = false
        state.end()
        token = nil
        running = false
        origin = nil
        previousCell = nil
        cellNames = [:]
        cellLabel = "—"
        presenceUntil = nil
        visitUntil = nil
        status = "停止：位置取得・気配を終了"
        if let initial = startBattery, initial >= 0, UIDevice.current.batteryLevel >= 0 {
            batteryDifference = String(format: "%.0fポイント（参考値）", (initial - UIDevice.current.batteryLevel) * 100)
        }
        add("停止。座標は保存・送信していません")
    }

    func clear() {
        guard !running else { return }
        entries = []
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        updatePermission()
        if running && (manager.authorizationStatus == .denied || manager.authorizationStatus == .restricted) {
            stop()
            status = "位置情報の許可が取り消されました"
        }
    }

    private func updatePermission() {
        switch manager.authorizationStatus {
        case .authorizedAlways: permission = "常に許可"
        case .authorizedWhenInUse: permission = "使用中のみ"
        case .denied: permission = "拒否"
        case .restricted: permission = "制限あり"
        case .notDetermined: permission = "未選択"
        @unknown default: permission = "不明"
        }
        permission += manager.accuracyAuthorization == .fullAccuracy ? " / 正確" : " / おおよそ"
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard running, let token else { return }
        let now = Date()
        guard state.isActive(now: now) else { stop(); status = "滞在期限切れ：自動復帰しません"; return }
        // Keep only the freshest callback sample, rather than replaying an old route.
        guard let location = locations.max(by: { $0.timestamp < $1.timestamp }) else { return }
        guard location.horizontalAccuracy >= 0, location.horizontalAccuracy <= 100,
              now.timeIntervalSince(location.timestamp) >= 0,
              now.timeIntervalSince(location.timestamp) <= PresenceState.maxSampleAge else {
            add("古い／精度不足の観測：更新保留")
            return
        }
        if origin == nil { origin = location }
        guard let origin else { return }
        // Approximate local grid for a small field test; origin remains memory-only.
        let north = (location.coordinate.latitude - origin.coordinate.latitude) * 111_320
        let east = (location.coordinate.longitude - origin.coordinate.longitude) * 111_320 * cos(origin.coordinate.latitude * .pi / 180)
        let key = "\(Int(floor(east / 100))),\(Int(floor(north / 100)))"
        if cellNames[key] == nil { cellNames[key] = "区画\(cellNames.count + 1)" }
        let label = cellNames[key]!
        revision += 1
        let sample = PresenceState.Sample(cell: label, observedAt: location.timestamp, revision: revision)
        // Test zone only: a 2km circle around the first fix, NOT the product street polygon.
        let result = state.receive(token: token, sample: sample,
                                   inside: location.distance(from: origin) <= 2_000, now: now)
        if result == .outside { stop(); status = "試験範囲（開始地点から2km）外"; return }
        guard result == .accepted else { add("更新保留：\(result.rawValue)"); return }
        let background = UIApplication.shared.applicationState == .background
        let gap = previousObservedAt.map { location.timestamp.timeIntervalSince($0) }
        if let gap { maximumGap = max(maximumGap, gap) }
        previousObservedAt = location.timestamp
        if let previousCell, previousCell != label { transitions += 1 }
        previousCell = label
        accepted += 1
        if background { backgroundAccepted += 1 }
        cellLabel = label
        presenceUntil = state.presenceExpiresAt
        visitUntil = state.visitExpiresAt
        let gapText = gap.map { String(format: "間隔%.0f秒", $0) } ?? "初回"
        add("\(background ? "背景" : "前面") / \(label) / \(gapText) / 精度約\(Int(location.horizontalAccuracy))m / 最新1件を置換")
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // Avoid dumping arbitrary OS diagnostic data/coordinates into logs.
        add("位置取得エラー：\((error as NSError).code)。期限は延長しません")
    }

    private func add(_ text: String) {
        entries.insert(Entry(time: Date(), text: text), at: 0)
        if entries.count > 300 { entries.removeLast(entries.count - 300) }
    }
}
