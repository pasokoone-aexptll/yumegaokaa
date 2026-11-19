import { useState } from "react";
import { Alert } from "react-native";
import { Host, Form, Section, Button, Toggle, Text } from "@expo/ui/swift-ui";
import {
  disabled,
  scrollDisabled,
  scrollContentBackground,
  tint,
  font,
} from "@expo/ui/swift-ui/modifiers";
import type { useOperatorDashboard } from "../../hooks/useOperatorDashboard";
export type OperatorFormProps = {
  data: ReturnType<typeof useOperatorDashboard>;
  open: (path: "/members" | "/moderation" | "/stickers") => void;
};
export function OperatorForm({ data, open }: OperatorFormProps) {
  const [revision, setRevision] = useState(0);
  return (
    <Host
      style={{ height: 290 + data.invites.length * 64 + (data.more ? 55 : 0) }}
      colorScheme="light"
      ignoreSafeArea="all"
    >
      <Form
        modifiers={[
          scrollDisabled(),
          scrollContentBackground("hidden"),
          font({ design: "rounded" }),
        ]}
      >
        <Section>
          <Button
            label="参加者・招待枠・利用停止"
            onPress={() => open("/members")}
          />
          <Button label="通報対応" onPress={() => open("/moderation")} />
          <Button label="ステッカー管理" onPress={() => open("/stickers")} />
        </Section>
        <Section
          title={`参加者 ${data.summary?.active_members ?? 0}人・有効な招待 ${data.summary?.active_invitations ?? 0}件`}
        >
          {data.invites.length === 0 && <Text>招待はありません</Text>}
          {data.invites.map((invite) => (
            <Toggle
              key={`${invite.id}:${revision}`}
              label={`${invite.issuer_name ?? "名前未設定"} → ${invite.recipient_name ?? (invite.used_at ? "参加済み" : "未使用")}`}
              isOn={!invite.revoked_at}
              modifiers={[
                tint("#34C759"),
                disabled(data.busy || !!invite.revoked_at),
              ]}
              onIsOnChange={() => {
                setRevision((value) => value + 1);
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
                );
              }}
            />
          ))}
          {data.more && (
            <Button
              label="続きを表示"
              onPress={() => void data.next()}
              modifiers={[disabled(data.busy)]}
            />
          )}
        </Section>
      </Form>
    </Host>
  );
}
