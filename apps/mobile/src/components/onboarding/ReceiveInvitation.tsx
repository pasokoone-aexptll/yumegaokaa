import { useContext, useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { CameraView } from "expo-camera";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ReducedIconMotion } from "../icons/IconMotion";
import { NativeAction } from "../denshin/NativeAction";
export function ReceiveInvitation({
  scanning,
  busy,
  status,
  onScan,
  onCancel,
  onCode,
  onLogout,
}: {
  scanning: boolean;
  busy: boolean;
  status: string;
  onScan: () => void;
  onCancel: () => void;
  onCode: (data: string) => void;
  onLogout: () => void;
}) {
  const { height, width } = useWindowDimensions(),
    insets = useSafeAreaInsets();
  return (
    <View style={[s.root, scanning && { backgroundColor: "rgba(0,0,0,0.86)" }]}>
      {busy ? (
        <InvitationChecking />
      ) : scanning ? (
        <>
          <Text
            style={[
              s.title,
              { top: height * 0.16, textAlign: "center", color: "white" },
            ]}
          >
            QR Codeをスキャンする
          </Text>
          <Text
            style={[
              s.description,
              {
                top: height * 0.22,
                textAlign: "center",
                color: "rgba(255,255,255,0.5)",
              },
            ]}
          >
            友達から届いた招待QRを枠に合わせてください
          </Text>
          <View
            style={{
              position: "absolute",
              top: height * 0.37,
              left: 28,
              right: 28,
              aspectRatio: 1,
              borderRadius: 32,
              overflow: "hidden",
            }}
          >
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={({ data }) => onCode(data)}
            />
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 300 300"
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              <Path
                d="M15 80V38Q15 15 38 15H80 M220 15H262Q285 15 285 38V80 M285 220V262Q285 285 262 285H220 M80 285H38Q15 285 15 262V220"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth={8}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </View>
          <Pressable
            style={{
              position: "absolute",
              bottom: insets.bottom + 30,
              alignSelf: "center",
              padding: 12,
            }}
            onPress={onCancel}
          >
            <Text style={{ color: "rgba(255,255,255,0.65)" }}>戻る</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Pressable
            onPress={onLogout}
            style={{
              position: "absolute",
              top: insets.top + 4,
              right: 24,
              padding: 10,
            }}
          >
            <Text
              style={{
                fontFamily: "ui-rounded",
                fontSize: 13,
                color: "rgba(0,0,0,0.38)",
              }}
            >
              別のアカウントでログイン
            </Text>
          </Pressable>
          <Text
            style={[
              s.title,
              {
                top: height * 0.145,
                fontFamily: "OnboardingDot",
                fontSize: 32,
                lineHeight: 40,
              },
            ]}
          >
            招待を受け取る
          </Text>
          <Text
            style={[
              s.description,
              { top: height * 0.215, fontSize: 18, lineHeight: 23 },
            ]}
          >
            招待を持っている友達から、QRコードを受け取ってください
          </Text>
          <Image
            source={require("../../../assets/superassets/こたつ.png")}
            style={{
              position: "absolute",
              top: height * 0.38,
              left: -16,
              width: width * 0.97,
              height: width * 0.97 * (1640 / 1432),
            }}
            resizeMode="contain"
          />
          <View
            style={{
              position: "absolute",
              left: 28,
              right: 28,
              bottom: insets.bottom + 4,
              gap: 16,
            }}
          >
            {!!status && (
              <Text accessibilityRole="alert" style={s.status}>
                {status}
              </Text>
            )}
            <NativeAction
              title="QRコードをスキャンする"
              tone="blue"
              contentWidth={270}
              onPress={onScan}
            />
          </View>
        </>
      )}
    </View>
  );
}
export function InvitationChecking() {
  const { height } = useWindowDimensions();
  const reduced = useContext(ReducedIconMotion),
    [motion] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) return;
    const animation = Animated.loop(
      Animated.timing(motion, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [motion, reduced]);
  return (
    <View style={s.root}>
      <Image
        source={require("../../../assets/superassets/DreamCloud.png")}
        style={{
          position: "absolute",
          alignSelf: "center",
          top: height * 0.315,
          width: 190,
          height: 130,
        }}
        resizeMode="contain"
      />
      <View
        style={{
          position: "absolute",
          alignSelf: "center",
          top: height * 0.49,
          width: 56,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 7,
        }}
      >
        {Array.from({ length: 9 }, (_, i) => (
          <Animated.View
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              backgroundColor: "#008CFF",
              opacity: reduced
                ? 0.6
                : motion.interpolate({
                    inputRange: Array.from({ length: 10 }, (_, n) => n / 9),
                    outputRange: Array.from(
                      { length: 10 },
                      (_, n) => 1 - ((n - i + 9) % 9) * 0.08,
                    ),
                  }),
            }}
          />
        ))}
      </View>
      <Text
        style={[
          s.description,
          {
            top: height * 0.625,
            fontSize: 24,
            lineHeight: 31,
            textAlign: "center",
          },
        ]}
      >
        センターに問い合わせています
      </Text>
      <Text
        style={[
          s.description,
          { top: height * 0.675, fontSize: 14, textAlign: "center" },
        ]}
      >
        これは自動で行われます · take a few seconds
      </Text>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "white" },
  title: {
    position: "absolute",
    left: 28,
    right: 28,
    fontSize: 26,
    lineHeight: 34,
    fontFamily: "ui-rounded",
    color: "black",
  },
  description: {
    position: "absolute",
    left: 28,
    right: 28,
    fontFamily: "ui-rounded",
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(0,0,0,0.35)",
  },
  status: { fontSize: 14, color: "#FF3B30", textAlign: "center" },
});
