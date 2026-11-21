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
import { NativeIconButton } from "../denshin/NativeIconButton";
const AnimatedPath = Animated.createAnimatedComponent(Path);

export function ReceiveInvitation({
  scanning,
  busy,
  status,
  onScan,
  onCancel,
  onCode,
  onLogout,
  cameraPreview = false,
}: {
  scanning: boolean;
  busy: boolean;
  status: string;
  onScan: () => void;
  onCancel: () => void;
  onCode: (data: string) => void;
  onLogout: () => void;
  /** Review fixture only: renders the same transition without opening a camera. */
  cameraPreview?: boolean;
}) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useContext(ReducedIconMotion);
  const [entry] = useState(() => new Animated.Value(0));
  const [scan] = useState(() => new Animated.Value(0));
  const [checking] = useState(() => new Animated.Value(busy ? 1 : 0));
  const [scannerVisible, setScannerVisible] = useState(scanning);
  const [scanReady, setScanReady] = useState(false);
  useEffect(() => {
    const animation = Animated.timing(entry, {
      toValue: 1,
      duration: reduced ? 0 : 950,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [entry, reduced]);
  useEffect(() => {
    if (busy) return;
    checking.setValue(0);
    if (!scanning) {
      setScannerVisible(false);
      setScanReady(false);
      scan.setValue(0);
      return;
    }
    setScannerVisible(true);
    const animation = Animated.timing(scan, {
      toValue: 1,
      duration: reduced ? 0 : 1900,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) setScanReady(true);
    });
    return () => animation.stop();
  }, [scanning, busy, reduced, scan, checking]);
  useEffect(() => {
    if (!busy) return;
    const animation = Animated.timing(checking, {
      toValue: 1,
      duration: reduced ? 0 : 600,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) setScannerVisible(false);
    });
    return () => animation.stop();
  }, [busy, checking, reduced]);
  const step = (range: number[], values: number[]) =>
    scan.interpolate({
      inputRange: range,
      outputRange: values,
      extrapolate: "clamp",
    });
  const buttonHeight = 54;
  const buttonBottom = insets.bottom + 4;
  const frameSize = width * 0.8;
  const cameraOpacity = step([0, 0.76, 1], [0, 0, 1]);
  return (
    <View style={s.root}>
      <Animated.View
        pointerEvents={scannerVisible || busy ? "none" : "auto"}
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: entry.interpolate({
              inputRange: [0, 0.15, 0.45, 1],
              outputRange: [0, 0, 1, 1],
            }),
          },
        ]}
      >
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
        <Animated.Image
          source={require("../../../assets/superassets/こたつ.png")}
          resizeMode="contain"
          style={{
            position: "absolute",
            top: height * 0.38,
            left: -16,
            width: width * 0.97,
            height: width * 0.97 * (1640 / 1432),
            opacity: entry.interpolate({
              inputRange: [0, 0.4, 0.9, 1],
              outputRange: [0, 0, 1, 1],
            }),
            transform: [
              {
                translateY: entry.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [60, 60, 0],
                }),
              },
            ],
          }}
        />
        <Animated.View
          style={{
            position: "absolute",
            left: 28,
            right: 28,
            bottom: buttonBottom,
            opacity: entry.interpolate({
              inputRange: [0, 0.15, 0.45, 1],
              outputRange: [0, 0, 1, 1],
            }),
            transform: [
              {
                translateY: entry.interpolate({
                  inputRange: [0, 0.15, 0.45, 1],
                  outputRange: [22, 22, 0, 0],
                }),
              },
            ],
          }}
        >
          {!!status && (
            <Text
              accessibilityRole="alert"
              style={[s.status, { marginBottom: 16 }]}
            >
              {status}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={onScan}
            style={{
              backgroundColor: "#308AFF",
              height: buttonHeight,
              borderRadius: 27,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{ fontFamily: "ui-rounded", fontSize: 18, color: "white" }}
            >
              QRコードをスキャンする
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
      {scannerVisible && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                {
                  translateX: checking.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -width],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View
            style={{
              position: "absolute",
              overflow: "hidden",
              left: step([0, 0.18, 1], [28, 0, 0]),
              right: step([0, 0.18, 1], [28, 0, 0]),
              top: step(
                [0, 0.18, 1],
                [height - buttonBottom - buttonHeight, 0, 0],
              ),
              bottom: step([0, 0.18, 1], [buttonBottom, 0, 0]),
              borderRadius: step([0, 0.15, 0.18, 1], [27, 27, 0, 0]),
              backgroundColor: scan.interpolate({
                inputRange: [0, 0.14, 0.18, 1],
                outputRange: ["#308AFF", "#163654", "#000000", "#000000"],
              }),
            }}
          >
            <Animated.Text
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                marginTop: -12,
                textAlign: "center",
                color: "white",
                fontSize: 18,
                opacity: step([0, 0.1, 0.18, 1], [1, 0.5, 0, 0]),
              }}
            >
              QRコードをスキャンする
            </Animated.Text>
          </Animated.View>
          <Animated.View
            style={[StyleSheet.absoluteFill, { opacity: cameraOpacity }]}
            pointerEvents="none"
          >
            {cameraPreview ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: "#595959" },
                ]}
              />
            ) : (
              <CameraView
                style={StyleSheet.absoluteFill}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={
                  busy || !scanReady ? undefined : ({ data }) => onCode(data)
                }
              />
            )}
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(0,0,0,0.24)" },
              ]}
            />
          </Animated.View>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { opacity: step([0, 0.57, 0.72, 1], [0, 0, 1, 1]) },
            ]}
            pointerEvents="box-none"
          >
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
              style={{ position: "absolute", top: insets.top + 4, left: 24 }}
            >
              <NativeIconButton
                icon="chevron-base"
                rotation={180}
                dark
                size={48}
                label="戻る"
                onPress={onCancel}
              />
            </View>
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: frameSize,
              height: frameSize,
              left: (width - frameSize) / 2,
              top: height * 0.55 - frameSize / 2,
              opacity: step([0, 0.6, 0.68, 1], [0, 0, 0.4, 1]),
              transform: [
                {
                  scale: step(
                    [0, 0.68, 0.75, 0.9, 1],
                    [0.35, 0.35, 0.45, 1, 1],
                  ),
                },
              ],
            }}
          >
            <Svg width="100%" height="100%" viewBox="0 0 300 300">
              <AnimatedPath
                d={scan.interpolate({
                  inputRange: [0, 0.72, 0.9, 1],
                  outputRange: [
                    "M15 149V38Q15 15 38 15H149 M151 15H262Q285 15 285 38V149 M285 151V262Q285 285 262 285H151 M149 285H38Q15 285 15 262V151",
                    "M15 149V38Q15 15 38 15H149 M151 15H262Q285 15 285 38V149 M285 151V262Q285 285 262 285H151 M149 285H38Q15 285 15 262V151",
                    "M15 70V38Q15 15 38 15H70 M230 15H262Q285 15 285 38V70 M285 230V262Q285 285 262 285H230 M70 285H38Q15 285 15 262V230",
                    "M15 70V38Q15 15 38 15H70 M230 15H262Q285 15 285 38V70 M285 230V262Q285 285 262 285H230 M70 285H38Q15 285 15 262V230",
                  ],
                })}
                stroke="rgba(255,255,255,0.85)"
                strokeWidth={8}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </Animated.View>
        </Animated.View>
      )}
      {busy && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                {
                  translateX: checking.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <InvitationChecking />
        </Animated.View>
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
        duration: 900,
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
              backgroundColor: "#409FFF",
              opacity: reduced
                ? 0.6
                : motion.interpolate({
                    inputRange: Array.from({ length: 19 }, (_, n) => n / 18),
                    outputRange: Array.from({ length: 19 }, (_, n) => {
                      const offset = [
                        0.22, 0.15, 0, 0.43, 0.25, 0.35, 0.5, 0.39, 0.61,
                      ][i];
                      const distance = Math.abs(
                        ((n / 18 - offset + 1.5) % 1) - 0.5,
                      );
                      return 1 - 0.52 * Math.max(0, 1 - distance / 0.19);
                    }),
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
