import { useNoticeMotion } from "./useNoticeMotion";
import { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { GlassView } from "expo-glass-effect";
import { SuperAsset } from "../icons/SuperAsset";

/** Dismissing this notice never changes the underlying visit or observation state. */
export type BannerProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => Promise<void>;
  autoDismiss?: boolean;
  children?: React.ReactNode;
};

export function Notice({
  message,
  children,
  actionLabel = "OK",
  onAction,
  autoDismiss = true,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => Promise<void>;
  autoDismiss?: boolean;
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const { visible, appearance, dismiss } = useNoticeMotion(autoDismiss);
  if (!visible) return null;
  return (
    <Animated.View
      style={{
        transform: [
          {
            translateY: appearance.interpolate({
              inputRange: [0, 1],
              outputRange: [18, 0],
            }),
          },
        ],
        marginTop: 8,
      }}
    >
      <GlassView
        glassEffectStyle="regular"
        colorScheme="dark"
        tintColor="rgba(0,0,0,0.5)"
        style={{
          overflow: "hidden",
          borderRadius: 999,
          borderCurve: "continuous",
        }}
      >
        <Animated.View
          style={{
            opacity: appearance,
            paddingVertical: 8,
            paddingLeft: 16,
            paddingRight: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              accessibilityLiveRegion="polite"
              style={{ color: "#ffffff99", fontWeight: "400", fontSize: 14 }}
            >
              {message}
            </Text>
            {children}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={onAction ? actionLabel : "通知を閉じる"}
            disabled={busy}
            accessibilityState={{ busy, disabled: busy }}
            onPress={async () => {
              if (!onAction) {
                dismiss();
                return;
              }
              setBusy(true);
              try {
                await onAction();
              } finally {
                setBusy(false);
              }
            }}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 24,
              width: onAction ? undefined : 28,
              height: 28,
              paddingHorizontal: onAction ? 10 : 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {busy ? (
              <ActivityIndicator color="black" />
            ) : !onAction ? (
              <SuperAsset name="x" size={12} tint="white" opacity={0.5} />
            ) : (
              <Text
                style={{
                  color: "white",
                  fontWeight: "600",
                  fontSize: 14,
                  fontFamily: Platform.OS === "ios" ? "ui-rounded" : undefined,
                }}
              >
                {actionLabel}
              </Text>
            )}
          </Pressable>
        </Animated.View>
      </GlassView>
    </Animated.View>
  );
}
