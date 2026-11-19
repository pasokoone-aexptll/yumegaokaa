import { useState } from "react";
import { Alert, View } from "react-native";
import {
  Host,
  Form,
  Section,
  Button,
  Toggle,
  Text,
  HStack,
  Spacer,
  RNHostView,
} from "@expo/ui/swift-ui";
import {
  disabled,
  scrollDisabled,
  scrollContentBackground,
  tint,
  font,
  foregroundStyle,
  listRowInsets,
  listSectionSpacing,
} from "@expo/ui/swift-ui/modifiers";
import { SuperAsset } from "../icons/SuperAsset";
import type { useOperatorDashboard } from "../../hooks/useOperatorDashboard";
export type OperatorFormProps = {
  data: ReturnType<typeof useOperatorDashboard>;
  open: (path: "/members" | "/moderation" | "/stickers") => void;
};
export function OperatorForm({ data, open }: OperatorFormProps) {
  const [revision, setRevision] = useState(0);
  return (
    <Host
      style={{
        height: 340 + data.invites.length * 64 + (data.more ? 55 : 0),
        marginHorizontal: -16,
        marginTop: 22,
      }}
      colorScheme="light"
      ignoreSafeArea="all"
    >
      <Form
        modifiers={[
          scrollDisabled(),
          scrollContentBackground("hidden"),
          font({ design: "rounded", size: 17 }),
          listSectionSpacing(62),
        ]}
      >
        <Section>
          {(
            [
              ["参加者・招待枠・利用停止", "/members"],
              ["通報対応", "/moderation"],
              ["ステッカー管理", "/stickers"],
            ] as const
          ).map(([label, path]) => (
            <Button
              key={path}
              onPress={() => open(path)}
              modifiers={[
                listRowInsets({
                  top: 12,
                  bottom: 12,
                  leading: 18,
                  trailing: 18,
                }),
              ]}
            >
              <HStack>
                <Text
                  modifiers={[foregroundStyle("black"), font({ size: 19 })]}
                >
                  {label}
                </Text>
                <Spacer />
                <RNHostView matchContents>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SuperAsset
                      name="chevron-base"
                      size={28}
                      tint="black"
                      opacity={0.2}
                    />
                  </View>
                </RNHostView>
              </HStack>
            </Button>
          ))}
        </Section>
        <Section>
          {data.invites.length === 0 && <Text>招待はありません</Text>}
          {data.invites.map((invite) => (
            <Toggle
              key={`${invite.id}:${revision}`}
              isOn={!invite.revoked_at}
              modifiers={[
                tint("#34C759"),
                listRowInsets({
                  top: 12,
                  bottom: 12,
                  leading: 18,
                  trailing: 14,
                }),
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
            >
              <HStack spacing={12}>
                <RNHostView matchContents>
                  <View style={{ width: 30, height: 30 }}>
                    <SuperAsset name="inviteFriends" size={30} />
                  </View>
                </RNHostView>
                <Text
                  modifiers={[
                    font({ design: "rounded", weight: "semibold", size: 16 }),
                  ]}
                >{`${invite.issuer_name ?? "名前未設定"} → ${invite.recipient_name ?? (invite.used_at ? "参加済み" : "未使用")}`}</Text>
              </HStack>
            </Toggle>
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
