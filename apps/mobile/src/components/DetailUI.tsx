import { BlurView } from "expo-blur";
import { glassMapSheet, mapBlur } from "./map/mapBlur";
import { IconPressable as Pressable } from "./icons/IconMotion";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { DetailIcon } from "./DetailIcon";

export function DetailPage({
  title,
  children,
  root = false,
  mapSheet = false,
  refreshing = false,
  onRefresh,
}: {
  title: string;
  children: ReactNode;
  root?: boolean;
  mapSheet?: boolean;
  refreshing?: boolean;
  onRefresh?: () => Promise<unknown>;
}) {
  const [reloading, setReloading] = useState(false);
  const glass = mapSheet && glassMapSheet;
  return (
    <SafeAreaView
      edges={
        root ? ["top", "left", "right"] : ["top", "bottom", "left", "right"]
      }
      style={[detail.page, glass && { backgroundColor: "#f2f2f799" }]}
    >
      {glass && <BlurView {...mapBlur} pointerEvents="none" tint="light" intensity={55} style={StyleSheet.absoluteFill} />}
      <ScrollView
        nestedScrollEnabled={glass}
        contentContainerStyle={detail.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        <View style={detail.navigation}>
          {!root ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="戻る"
              hitSlop={8}
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/")
              }
              style={detail.round}
            >
              <DetailIcon name="chevron-back" size={22} color="#111" />
            </Pressable>
          ) : (
            <View />
          )}
          {onRefresh && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="再読み込み"
              disabled={refreshing || reloading}
              onPress={async () => {
                setReloading(true);
                try {
                  await onRefresh();
                } finally {
                  setReloading(false);
                }
              }}
              style={detail.round}
            >
              {refreshing || reloading ? (
                <ActivityIndicator color="#111" />
              ) : (
                <DetailIcon name="reload" size={19} color="#111" />
              )}
            </Pressable>
          )}
        </View>
        <Text style={detail.title}>{title}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Section({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: 8 }}>
      {title && <Text style={detail.sectionTitle}>{title}</Text>}
      <View style={detail.group}>{children}</View>
    </View>
  );
}
export function DetailRow({
  leading,
  title,
  subtitle,
  icon,
  onPress,
  danger = false,
  disabled = false,
  selected,
}: {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  icon?: React.ComponentProps<typeof DetailIcon>["name"];
  onPress?: () => void;
  danger?: boolean;
  disabled?: boolean;
  selected?: boolean;
}) {
  const content = (
    <>
      {leading}
      {icon && (
        <DetailIcon
          name={icon}
          size={21}
          color={danger ? "#c52836" : "#00000088"}
        />
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[detail.rowTitle, danger && { color: "#c52836" }]}>
          {title}
        </Text>
        {subtitle && <Text style={detail.secondary}>{subtitle}</Text>}
      </View>
      {selected !== undefined ? (
        <DetailIcon
          name={selected ? "checkmark-circle" : "ellipse-outline"}
          size={23}
          color={selected ? "#008cff" : "#00000033"}
        />
      ) : (
        onPress && (
          <DetailIcon name="chevron-forward" size={17} color="#00000055" />
        )
      )}
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole={selected === undefined ? "button" : "radio"}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        detail.row,
        { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
      ]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={detail.row}>{content}</View>
  );
}
export function PrimaryAction({
  title,
  disabled,
  onPress,
}: {
  title: string;
  disabled?: boolean;
  onPress: () => void | Promise<unknown>;
}) {
  const [running, setRunning] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || running, busy: running }}
      disabled={disabled || running}
      onPress={async () => {
        setRunning(true);
        try {
          await onPress();
        } finally {
          setRunning(false);
        }
      }}
      style={[detail.primary, { opacity: disabled || running ? 0.45 : 1 }]}
    >
      {running ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={detail.primaryText}>{title}</Text>
      )}
    </Pressable>
  );
}
export const detail = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f2f2f7" },
  navigation: {
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  round: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 36,
    gap: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    color: "#111",
    letterSpacing: -0.6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#00000088",
    paddingHorizontal: 4,
  },
  group: {
    backgroundColor: "white",
    borderRadius: 20,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  row: {
    minHeight: 55,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#0000000d",
  },
  rowTitle: { fontSize: 16, color: "#111" },
  secondary: { fontSize: 14, lineHeight: 21, color: "#00000088" },
  body: { fontSize: 16, lineHeight: 25, color: "#000000cc" },
  primary: {
    minHeight: 52,
    padding: 15,
    borderRadius: 16,
    borderCurve: "continuous",
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { fontSize: 17, fontWeight: "600", color: "white" },
  input: {
    fontSize: 17,
    color: "#111",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 16,
  },
  error: { color: "#b32845", fontSize: 14, lineHeight: 21 },
});
