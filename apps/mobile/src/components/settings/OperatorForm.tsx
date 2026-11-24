import { Alert, Text, View, Switch } from "react-native";
import { SuperAsset } from "../icons/SuperAsset";
import { DetailRow, Section } from "../DetailUI";
import type { useOperatorDashboard } from "../../hooks/useOperatorDashboard";
export type OperatorFormProps = {
  data: ReturnType<typeof useOperatorDashboard>;
  open: (path: "/members" | "/moderation" | "/stickers") => void;
};
export function OperatorForm({ data, open }: OperatorFormProps) {
  return (
    <>
      <Section>
        <DetailRow
          title="参加者・招待枠・利用停止"
          onPress={() => open("/members")}
        />
        <DetailRow title="通報対応" onPress={() => open("/moderation")} />
        <DetailRow title="ステッカー管理" onPress={() => open("/stickers")} />
      </Section>
      <Section>
        {data.invites.length === 0 && <DetailRow title="招待はありません" />}
        {data.invites.map((invite) => (
          <View
            key={invite.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 18,
              paddingVertical: 12,
            }}
          >
            <SuperAsset name="inviteFriends" size={30} />
            <Text style={{ flex: 1, fontSize: 16, fontWeight: "600" }}>
              {`${invite.issuer_name ?? "名前未設定"} → ${invite.recipient_name ?? (invite.used_at ? "参加済み" : "未使用")}`}
            </Text>
            <Switch
              accessibilityLabel={`${invite.issuer_name ?? "名前未設定"}の招待`}
              value={!invite.revoked_at}
              disabled={data.busy || !!invite.revoked_at}
              trackColor={{ true: "#34C759" }}
              onValueChange={() =>
                Alert.alert(
                  "招待を無効化しますか？",
                  "この招待から新たに参加できなくなります。",
                  [
                    { text: "戻る", style: "cancel" },
                    {
                      text: "無効化",
                      style: "destructive",
                      onPress: () => void data.revoke(invite.id),
                    },
                  ],
                )
              }
            />
          </View>
        ))}
        {data.more && (
          <DetailRow
            title="続きを表示"
            disabled={data.busy}
            onPress={() => void data.next()}
          />
        )}
      </Section>
    </>
  );
}
