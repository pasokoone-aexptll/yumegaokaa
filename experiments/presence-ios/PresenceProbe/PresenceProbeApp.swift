import SwiftUI

@main
struct PresenceProbeApp: App {
    @StateObject private var model = ProbeModel()
    var body: some Scene {
        WindowGroup {
            NavigationStack {
                List {
                    Section("技術検証専用・製品ではありません") {
                        Text("開始すると画面ロック中も位置を取得します。座標は端末メモリ内だけで扱い、通信・永続保存はしません。停止ボタンで終了してください。")
                        Text("NFC・ログイン・実サーバーは模擬です。背景での観測可否を調べます。")
                        Text(model.permission)
                        Button("使用中の位置情報を許可") { model.requestPermission() }
                        Button("背景の許可を追加で要求") { model.requestBackgroundPermission() }
                        Text("追加の許可画面が出ない場合は、iOS設定でこのアプリの位置情報を確認してください。")
                            .font(.caption)
                    }
                    Section("操作") {
                        Button("検証開始（模擬チェックイン）") { model.start() }.disabled(model.running)
                        Button("停止・気配終了", role: .destructive) { model.stop() }.disabled(!model.running)
                        Text(model.status)
                    }
                    Section("結果：同じ滞在の最新1件だけ") {
                        Text("受理 \(model.accepted) / 背景 \(model.backgroundAccepted) / 区画変化 \(model.transitions)")
                        Text("最大観測間隔：\(Int(model.maximumGap))秒")
                        TimelineView(.periodic(from: .now, by: 1)) { context in
                            let presenceValid = model.presenceUntil.map { context.date < $0 } ?? false
                            let visitValid = model.visitUntil.map { context.date < $0 } ?? false
                            Text("気配：\(presenceValid && visitValid ? model.cellLabel : "なし（未観測または失効）")")
                        }
                        if let until = model.presenceUntil { Text("気配期限：\(until.formatted(date: .omitted, time: .standard))") }
                        if let until = model.visitUntil { Text("滞在期限：\(until.formatted(date: .omitted, time: .standard))") }
                        Text("停止時の電池減少：\(model.batteryDifference)")
                        Text("10分以上の観測空白では気配が途切れます。0表示は現地に人がいない証拠ではありません。")
                            .font(.caption)
                    }
                    Section("メモリ内の観測記録（最大300件）") {
                        Button("停止後に記録を消す") { model.clear() }.disabled(model.running)
                        ForEach(model.entries) { entry in
                            VStack(alignment: .leading) {
                                Text(entry.time.formatted(date: .omitted, time: .standard)).font(.caption)
                                Text(entry.text).font(.caption)
                            }
                        }
                    }
                }
                .navigationTitle("気配の背景検証")
            }
        }
    }
}
