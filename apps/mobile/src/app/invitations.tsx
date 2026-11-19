import { NativeToggle as Switch } from "../components/denshin/NativeToggle";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SvgXml } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DetailPage } from "../components/DetailUI";
import { NativeAction } from "../components/denshin/NativeAction";
import { SuperAsset } from "../components/icons/SuperAsset";
import { native } from "../lib/native";
import { inviteSvg, parseInviteQR } from "../lib/inviteQR";
import { useInvitations } from "../hooks/useInvitations";
export default function Invitations() {
  const d = useInvitations();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const router = useRouter();
  const { revoke } = useLocalSearchParams<{ revoke?: string }>();
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const current = d.items.find((i) => i.id === d.issued?.id);
  const svg = useMemo(
    () => (d.issued ? inviteSvg(d.issued.code) : null),
    [d.issued],
  );
  const remaining = current
    ? Math.max(
        0,
        Math.min(
          1,
          (Date.parse(current.expires_at) - now) /
            (Date.parse(current.expires_at) - Date.parse(current.created_at)),
        ),
      )
    : 0;
  const target = d.items.find((i) => i.id === revoke);
  return (
    <DetailPage
      root={d.receiving}
      title={d.receiving ? "招待を受け取る" : "Invite friends to the app"}
    >
      {revoke && !target ? (
        <Text style={s.secondary}>
          {d.loading ? "読み込み中…" : "この招待は表示できません。"}
        </Text>
      ) : target ? (
        <View style={s.confirm}>
          <Text style={s.title}>招待を削除しますか？</Text>
          <View style={s.row}>
            <SuperAsset name="inviteFriends" size={32} />
            <Text style={s.name}>
              {target.recipient_name ??
                (target.used ? "登録済みの相手" : "未使用")}
            </Text>
          </View>
          <Text style={s.secondary}>
            {target.used
              ? "登録済みの相手も利用停止になります。街への参加・チャット等を利用できなくなります。"
              : "このQRは使用できなくなります。"}
          </Text>
          <NativeAction
            title="削除"
            destructive
            disabled={d.busy}
            onPress={() => {
              void d.act("invite_revoke", { id: target.id }).then((ok) => {
                if (ok) router.back();
              });
            }}
          />
          <NativeAction title="戻る" onPress={() => router.back()} />
        </View>
      ) : d.receiving ? (
        <>
          <View style={s.scan}>
            {permission?.granted && scanning ? (
              <CameraView
                style={{ width: "100%", height: "100%" }}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={({ data }) => {
                  const code = parseInviteQR(data);
                  if (!code || d.busy) return;
                  setScanning(false);
                  void d.act("invite_accept", { code });
                }}
              />
            ) : (
              <SuperAsset name="非常口から人が出る" width={230} height={280} />
            )}
          </View>
          <NativeAction
            title="招待QRを読み込む"
            disabled={d.busy}
            onPress={() => {
              void requestPermission().then((p) => {
                if (p.granted) setScanning(true);
                else
                  d.setStatus("設定からカメラへのアクセスを許可してください。");
              });
            }}
          />
          <NativeAction
            title="ログアウト"
            disabled={d.busy}
            onPress={() => {
              void native
                .logout()
                .catch(() => d.setStatus("ログアウトできませんでした。"));
            }}
          />
        </>
      ) : (
        <>
          <View style={s.qr}>
            {svg && remaining > 0 ? (
              <SvgXml xml={svg} width={270} height={270} />
            ) : (
              <SuperAsset
                name="非常口から人が出るrounded"
                width={100}
                height={120}
              />
            )}
          </View>
          {!!svg && (
            <View style={s.gauge}>
              {Array.from({ length: 36 }, (_, i) => (
                <View
                  key={i}
                  style={[s.tick, { opacity: i / 36 < remaining ? 1 : 0.12 }]}
                />
              ))}
            </View>
          )}
          <NativeAction
            title={d.pending ? "前回の招待を確認" : "招待を発行"}
            disabled={d.busy}
            onPress={() => void d.act("invite_create")}
          />
          {!!current && (
            <Text style={s.secondary}>
              expiration date{" "}
              {new Date(current.expires_at).toLocaleDateString()}
            </Text>
          )}
          <Text style={[s.title, s.history]}>History</Text>
          {d.items.map((i) => (
            <View key={i.id} style={s.row}>
              <SuperAsset name="inviteFriends" size={30} />
              <Text style={s.name}>
                {d.issuerName ? `${d.issuerName} → ` : ""}
                {i.recipient_name ?? (i.used ? "登録済み" : "未使用")}
              </Text>
              <Switch
                key={`${i.id}:${d.loading}`}
                accessibilityLabel={`${i.recipient_name ?? "招待"}を有効にする`}
                value={!i.revoked && (i.used || !i.expired)}
                disabled={d.busy || i.revoked || (!i.used && i.expired)}
                onValueChange={() =>
                  router.push({
                    pathname: "/settings/invitations",
                    params: { revoke: i.id },
                  })
                }
              />
            </View>
          ))}
        </>
      )}
      {(d.busy || d.loading) && <ActivityIndicator />}
      {!!d.status && (
        <Text accessibilityRole="alert" style={s.secondary}>
          {d.status}
        </Text>
      )}
    </DetailPage>
  );
}
const s = StyleSheet.create({
  qr: {
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 35,
  },
  scan: {
    height: 330,
    borderRadius: 30,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  gauge: {
    flexDirection: "row",
    alignSelf: "center",
    gap: 2,
    padding: 7,
    borderRadius: 10,
    marginBottom: 20,
  },
  tick: { width: 4, height: 18, borderRadius: 4, backgroundColor: "#00AF6B" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
    borderRadius: 26,
    backgroundColor: "white",
    marginBottom: 2,
  },
  name: { flex: 1, fontFamily: "ui-rounded", fontWeight: "600", fontSize: 17 },
  secondary: {
    color: "rgba(0,0,0,0.4)",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 23,
  },
  title: {
    fontFamily: "ui-rounded",
    fontWeight: "600",
    fontSize: 28,
    textAlign: "center",
  },
  history: { color: "rgba(0,0,0,0.2)", marginTop: 70, marginBottom: 18 },
  confirm: { gap: 35, paddingTop: 60 },
});
