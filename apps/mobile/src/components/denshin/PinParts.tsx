import { EventCloudPin } from "../EventCloudPin";
import {
  DenshinLogo,
  SuperAsset,
  type SuperAssetName,
} from "../icons/SuperAsset";
import { SpeechBubble } from "./SpeechBubble";
import { NativeIconButton } from "./NativeIconButton";
import { StyleSheet, Text, View } from "react-native";
import { Avatar } from "../Avatar";
import { BlurView } from "expo-blur";
import type { PinPerson } from "../../lib/denshin";
export const green = "#34C759";
export function RecruitmentGlyph({ color = green }: { color?: string }) {
  return <SuperAsset name="非常口rounded" size={21} tint={color} />;
}
export function RecruitBadge() {
  return (
    <SpeechBubble>
      <RecruitmentGlyph />
      <Text style={s.badgeText}>募集中</Text>
    </SpeechBubble>
  );
}
export function PinHeading({ suffix = "PIN" }: { suffix?: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 5,
        flexShrink: 1,
      }}
    >
      <DenshinLogo dark width={suffix === "PIN" ? 72 : 60} />
      <Text style={s.suffix}>
        <Text style={suffix === "PIN" ? s.pin : s.editorPin}>PIN</Text>
        {suffix.slice(3) ? ` ${suffix.slice(3)}` : ""}
      </Text>
    </View>
  );
}
export function RoundAction({
  label,
  glyph,
  onPress,
  disabled = false,
  active = false,
  size = 44,
}: {
  label: string;
  glyph: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
  size?: number;
}) {
  const icons: Record<string, SuperAssetName> = {
    "×": "x",
    "✓": "check",
    "−": "minus",
    "＋": "add",
    "✎": "edit",
  };
  return (
    <NativeIconButton
      icon={icons[glyph] ?? "check"}
      label={label}
      onPress={onPress}
      disabled={disabled}
      active={active}
      size={size}
    />
  );
}
export function PeopleStack({ people }: { people: PinPerson[] }) {
  return (
    <View style={s.people}>
      {people.slice(0, 3).map((p) => (
        <View key={p.account_id} style={s.overlap}>
          <Avatar path={p.avatar_path} name={p.display_name} size={33} />
        </View>
      ))}
      {people.length > 3 && (
        <View style={[s.overlap, s.more]}>
          <BlurView
            pointerEvents="none"
            intensity={70}
            tint="systemThinMaterialDark"
            style={StyleSheet.absoluteFill}
          />
          <Text
            style={{ color: "white", fontSize: 17, fontFamily: "ui-rounded" }}
          >
            +{people.length - 3}
          </Text>
        </View>
      )}
    </View>
  );
}
// Reuse the supplied Figma recruitment sign and its existing platform shadows.
export function RecruitmentSign() {
  return <EventCloudPin />;
}
const s = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "white",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: green,
    fontWeight: "500",
    fontSize: 17,
    lineHeight: 21,
    fontFamily: "ui-rounded",
    alignSelf: "center",
  },
  heading: { color: "#ffffffdd", fontWeight: "600", fontSize: 27 },
  suffix: {
    fontFamily: "ui-rounded",
    color: "rgba(255,255,255,0.65)",
    fontWeight: "400",
    fontSize: 18,
    lineHeight: 24,
    marginBottom: -1,
  },
  pin: { fontSize: 16, fontWeight: "600" },
  editorPin: { fontSize: 14, fontWeight: "600" },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff26",
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: { color: "white", fontSize: 26 },
  people: { flexDirection: "row", paddingLeft: 20, alignItems: "center" },
  overlap: {
    marginLeft: -20,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 19,
  },
  more: {
    width: 37,
    height: 37,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
