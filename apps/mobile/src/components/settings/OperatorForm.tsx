import { Alert } from "react-native";
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
        {data.invites.map((invite) => (
          <DetailRow
            key={invite.id}
            title={`${invite.issuer_name ?? "名前未設定"} → ${invite.recipient_name ?? "未使用"}`}
            subtitle={invite.revoked_at ? "無効化済み" : "有効"}
            disabled={data.busy || !!invite.revoked_at}
            onPress={() =>
              Alert.alert("招待を無効化しますか？", "", [
                { text: "戻る", style: "cancel" },
                { text: "無効化", onPress: () => void data.revoke(invite.id) },
              ])
            }
          />
        ))}
      </Section>
    </>
  );
}
