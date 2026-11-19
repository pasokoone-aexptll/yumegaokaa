import { Platform, View } from "react-native";
import { Host, Menu, Toggle, Section, RNHostView } from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  buttonStyle,
  disabled as disabledModifier,
} from "@expo/ui/swift-ui/modifiers";
import { SuperAsset } from "../icons/SuperAsset";
export function ModeDropdown({
  ghost,
  active,
  disabled,
  onChange,
  placesVisible,
  onTogglePlaces,
}: {
  placesVisible?: boolean;
  onTogglePlaces?: () => void;
  ghost: boolean;
  active: boolean;
  disabled: boolean;
  onChange?: (ghost: boolean) => void;
}) {
  return (
    <Host
      style={{ width: 64, height: 38 }}
      colorScheme="dark"
      ignoreSafeArea="all"
      alignment="center"
    >
      <Menu
        modifiers={[
          buttonStyle(Number(Platform.Version) >= 26 ? "glass" : "bordered"),
          disabledModifier(disabled || !onChange),
          accessibilityLabel(`気配の公開設定：${ghost ? "ゴースト" : "通常"}`),
        ]}
        label={
          <RNHostView matchContents>
            <View
              style={{
                width: 42,
                height: 22,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: ghost ? "rgba(255,255,255,0.45)" : "#01AE6B",
                }}
              />
              <View style={{ transform: [{ rotate: "90deg" }] }}>
                <SuperAsset
                  name="chevron-base"
                  tint="white"
                  opacity={0.7}
                  size={18}
                />
              </View>
            </View>
          </RNHostView>
        }
      >
        <Section title="ゴースト中も人数に含まれます。気配を隠し、募集を終了します。投稿には名前が表示されます。">
          <Toggle
            label="通常モード"
            isOn={!ghost}
            onIsOnChange={() => {
              if (ghost) onChange?.(false);
            }}
          />
          <Toggle
            label="ゴーストモード"
            isOn={ghost}
            onIsOnChange={() => {
              if (!ghost) onChange?.(true);
            }}
          />
        </Section>
        {active && onTogglePlaces && (
          <Toggle
            label="ログイン場所・街の範囲"
            isOn={placesVisible}
            onIsOnChange={() => onTogglePlaces()}
          />
        )}
      </Menu>
    </Host>
  );
}
