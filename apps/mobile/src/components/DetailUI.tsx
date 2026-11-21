import type { ComponentRef } from "react";
import { BlurView } from "expo-blur";
import NativeMaskedView from "@react-native-masked-view/masked-view";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { SheetChrome } from "./SheetChrome";

import { IconPressable as Pressable } from "./icons/IconMotion";
import type { ReactNode, ComponentType, ReactElement } from "react";
import { Children, Fragment, useState, useRef } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewProps,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { NativeIconButton } from "./denshin/NativeIconButton";
import { DetailIcon } from "./DetailIcon";

const MaskedView = NativeMaskedView as unknown as ComponentType<
  ViewProps & { maskElement: ReactElement }
>;

export function DetailPage({
  title,
  children,
  root = false,
  mapSheet = false,
  refreshing = false,
  onRefresh,
  background,
  titleColor,
  titleStyle,
  bottomPadding,
  initialScrollY = 0,
}: {
  title: string;
  children: ReactNode;
  root?: boolean;
  mapSheet?: boolean;
  refreshing?: boolean;
  onRefresh?: () => Promise<unknown>;
  background?: ReactNode;
  titleColor?: string;
  titleStyle?: TextStyle;
  bottomPadding?: number;
  initialScrollY?: number;
}) {
  const router = useRouter();
  const [reloading, setReloading] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(61);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const insets = useSafeAreaInsets();
  const edgeToEdge = Platform.OS === "ios" && !root;
  const materialSheet = mapSheet && Platform.OS === "android";
  return (
    <SafeAreaView
      edges={
        materialSheet
          ? ["left", "right", "bottom"]
          : root || edgeToEdge
            ? ["top", "left", "right"]
            : ["top", "bottom", "left", "right"]
      }
      style={[detail.page, materialSheet && { backgroundColor: "white" }]}
    >
      {background}
      {materialSheet && <SheetChrome />}
      <ScrollView
        ref={scrollRef}
        onContentSizeChange={() => {
          if (initialScrollY > 0)
            scrollRef.current?.scrollTo({ y: initialScrollY, animated: false });
        }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing || reloading}
              onRefresh={() => {
                setReloading(true);
                void onRefresh().finally(() => setReloading(false));
              }}
            />
          ) : undefined
        }
        nestedScrollEnabled={materialSheet}
        contentContainerStyle={[
          detail.content,
          { paddingTop: headerHeight + 24 },
          edgeToEdge && {
            paddingBottom: detail.content.paddingBottom + insets.bottom,
          },
          bottomPadding !== undefined && { paddingBottom: bottomPadding },
        ]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        {children}
      </ScrollView>
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: materialSheet ? 0 : insets.top,
          left: 0,
          right: 0,
          zIndex: 2,
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: -insets.top,
            height: insets.top + headerHeight + 36,
          }}
        >
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={
              <Svg width="100%" height="100%">
                <Defs>
                  <LinearGradient id="detailEdge" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="white" />
                    <Stop offset="0.65" stopColor="white" />
                    <Stop offset="1" stopColor="white" stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#detailEdge)" />
              </Svg>
            }
          >
            <BlurView
              tint="light"
              intensity={65}
              style={StyleSheet.absoluteFill}
            />
          </MaskedView>
        </View>
        <View
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
          style={[detail.navigation, { marginHorizontal: 22 }]}
        >
          {!root ? (
            <NativeIconButton
              icon="chevron-base"
              rotation={180}
              dark={false}
              label="戻る"
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/")
              }
            />
          ) : (
            <View style={{ width: 49 }} />
          )}
          <Text
            style={[
              detail.title,
              titleColor ? { color: titleColor } : undefined,
              titleStyle,
            ]}
          >
            {title}
          </Text>
          <View style={{ width: 49 }} />
        </View>
      </View>
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
      <View style={detail.group}>
        {Children.toArray(children).map((child, index, rows) => (
          <Fragment key={index}>
            {child}
            {index < rows.length - 1 && (
              <View
                style={{
                  height: StyleSheet.hairlineWidth,
                  marginLeft: 48,
                  marginRight: 14,
                  backgroundColor: "rgba(0,0,0,0.07)",
                }}
              />
            )}
          </Fragment>
        ))}
      </View>
    </View>
  );
}
export function DetailRow({
  leading,
  title,
  subtitle,
  titleStyle,
  icon,
  onPress,
  danger = false,
  disabled = false,
  selected,
}: {
  title: string;
  subtitle?: string;
  titleStyle?: TextStyle;
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
          size={30}
          color={danger ? "#c52836" : "#00000088"}
        />
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={[detail.rowTitle, titleStyle, danger && { color: "#c52836" }]}
        >
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
          <DetailIcon name="chevron-forward" size={28} color="#00000055" />
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
  page: { flex: 1, backgroundColor: "#F6F6F6" },
  navigation: {
    marginHorizontal: -4,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
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
    padding: 26,
    paddingTop: 0,
    paddingBottom: 36,
    gap: 24,
  },
  title: {
    fontFamily: "ui-rounded",
    flex: 1,
    textAlign: "center",
    fontSize: 19,
    fontWeight: "600",
    color: "black",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#00000088",
    paddingHorizontal: 4,
  },
  group: {
    backgroundColor: "white",
    borderRadius: 26,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  row: {
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowTitle: {
    fontFamily: "ui-rounded",
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
  },
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
