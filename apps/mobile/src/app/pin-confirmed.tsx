import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useDenshinDetail } from "../hooks/useDenshinDetail";
import { PinSheet } from "../components/denshin/PinSheet";
import {
  PinHeading,
  RecruitBadge,
  RoundAction,
} from "../components/denshin/PinParts";
import { Avatar } from "../components/Avatar";
import { SuperAsset } from "../components/icons/SuperAsset";
export default function PinConfirmed() {
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const data = useDenshinDetail(id);
  return <PinConfirmedView data={data} />;
}
export function PinConfirmedView({
  data,
}: {
  data: ReturnType<typeof useDenshinDetail>;
}) {
  const router = useRouter();
  const pin = data.pin;
  return (
    <PinSheet>
      <ScrollView
        contentContainerStyle={{
          padding: 28,
          paddingTop: 16,
          gap: 26,
          flexGrow: 1,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <PinHeading />
          <RoundAction label="閉じる" glyph="×" onPress={() => router.back()} />
        </View>
        {data.loading ? (
          <ActivityIndicator />
        ) : pin && pin.attendance !== "left" ? (
          <View style={{ alignItems: "center", marginTop: 54 }}>
            <View>
              <Avatar
                shape="square"
                path={pin.avatar_path}
                name={pin.display_name}
                size={96}
              />
              <View style={{ position: "absolute", top: -18, left: 52 }}>
                <RecruitBadge />
              </View>
            </View>
            <Text
              style={{
                fontSize: 29,
                fontWeight: "600",
                color: "white",
                textAlign: "center",
                marginTop: 32,
              }}
            >
              {pin.body}
            </Text>
            <View style={{ marginTop: 48 }}>
              <SuperAsset name="checkRounded" size={58} />
            </View>
            <Text
              style={{
                fontSize: 24,
                color: "white",
                fontWeight: "600",
                marginTop: 26,
              }}
            >
              参加確定
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: 17,
                textAlign: "center",
                lineHeight: 30,
                marginTop: 23,
              }}
            >
              ありがとうございます。お会いできるのを楽しみにしています！
            </Text>
          </View>
        ) : (
          <Text style={{ color: "white" }}>
            {data.error ||
              "現在の参加状態を確認できません。詳細画面で確認してください。"}
          </Text>
        )}
      </ScrollView>
    </PinSheet>
  );
}
