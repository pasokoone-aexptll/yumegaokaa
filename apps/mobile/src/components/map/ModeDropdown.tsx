import { useRef, useState, type ComponentRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SuperAsset } from "../icons/SuperAsset";
import { SmoothSurface } from "./SmoothSurface";

export function ModeDropdown({
  dark = true,
  ghost,
  active,
  disabled,
  onChange,
  placesVisible,
  onTogglePlaces,
}: {
  dark?: boolean;
  placesVisible?: boolean;
  onTogglePlaces?: () => void;
  ghost: boolean;
  active: boolean;
  disabled: boolean;
  onChange?: (ghost: boolean) => void;
}) {
  const button = useRef<ComponentRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(
    null,
  );
  const [progress] = useState(() => new Animated.Value(0));
  const { width } = useWindowDimensions();
  const animate = (open: boolean) =>
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? 200 : 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
  function close() {
    animate(false).start(({ finished }) => {
      if (finished) setAnchor(null);
    });
  }
  return (
    <View ref={button} collapsable={false}>
      <Pressable
        disabled={disabled || !onChange}
        accessibilityRole="button"
        accessibilityLabel={`気配の公開設定：${ghost ? "ゴースト" : "通常"}`}
        accessibilityState={{
          expanded: !!anchor,
          disabled: disabled || !onChange,
        }}
        onPress={() =>
          button.current?.measureInWindow((x, y, w, h) => {
            progress.setValue(0);
            setAnchor({
              left: Math.max(8, Math.min(width - 236, dark ? x + w - 228 : x)),
              top: y + h + 6,
            });
          })
        }
      >
        <View
          style={[
            styles.trigger,
            {
              borderRadius: 17,
              backgroundColor: "rgba(0,0,0,0.05)",
              borderWidth: dark ? 1 : 0,
              borderColor: "rgba(255,255,255,0.2)",
            },
          ]}
        >
          <View
            style={[
              styles.dot,
              {
                backgroundColor: ghost
                  ? dark
                    ? "#9a9a9e"
                    : "rgba(0,0,0,0.55)"
                  : active
                    ? "#00bc83"
                    : "#ffffff66",
              },
            ]}
          />
          <Animated.View
            style={{
              transform: [
                {
                  rotate: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["90deg", "-90deg"],
                  }),
                },
              ],
            }}
          >
            <SuperAsset
              name="chevron-base"
              size={24}
              tint={dark ? "white" : "black"}
              opacity={0.7}
            />
          </Animated.View>
        </View>
      </Pressable>
      {anchor && (
        <Modal
          transparent
          visible
          statusBarTranslucent
          onShow={() => animate(true).start()}
          onRequestClose={close}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="メニューを閉じる"
            onPress={close}
          />
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.menu,
              anchor,
              {
                opacity: progress,
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-9, 0],
                    }),
                  },
                  {
                    scale: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <SmoothSurface
              radius={18}
              color="#000000cc"
              blurIntensity={28}
              style={{ padding: 8 }}
            >
              {[false, true].map((option) => (
                <Pressable
                  key={String(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: ghost === option, disabled }}
                  disabled={disabled}
                  onPress={() => {
                    close();
                    if (option !== ghost) onChange?.(option);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor:
                        pressed || option === ghost
                          ? "#ffffff20"
                          : "transparent",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: option ? "#9a9a9e" : "#00bc83" },
                    ]}
                  />
                  <Text style={styles.label}>
                    {option ? "ゴーストモード" : "通常モード"}
                  </Text>
                  {option === ghost && (
                    <Text accessibilityElementsHidden style={styles.label}>
                      ✓
                    </Text>
                  )}
                </Pressable>
              ))}
              <Text style={styles.note}>
                ゴースト中も人数に含まれます。気配を隠し、募集を終了します。投稿には名前が表示されます。
              </Text>
              {onTogglePlaces && (
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: !!placesVisible }}
                  onPress={() => {
                    onTogglePlaces();
                    close();
                  }}
                  style={styles.option}
                >
                  <Text style={styles.label}>ログイン場所・街の範囲</Text>
                  <Text style={styles.label}>{placesVisible ? "✓" : "○"}</Text>
                </Pressable>
              )}
            </SmoothSurface>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  trigger: {
    width: 52,
    height: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  menu: { position: "absolute", width: 228, maxWidth: "94%" },
  option: {
    minHeight: 46,
    borderRadius: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: { color: "white", fontSize: 15, fontWeight: "600" },
  note: { color: "#dddddf", fontSize: 12, lineHeight: 18, margin: 8 },
});
