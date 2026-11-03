import { useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { SmoothSurface } from "./SmoothSurface";
export function MapErrorDialog({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);
  const onClose = () => setVisible(false);
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
        <SmoothSurface
          color="#222222"
          radius={36}
          style={{
            width: "100%",
            maxWidth: 360,
            minHeight: 230,
            borderRadius: 36,
            borderCurve: "continuous",
            overflow: "hidden",
            padding: 20,
          }}
        >
          <Image
            source={require("../../../assets/figma-map/dialog-background.png")}
            resizeMode="contain"
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
            }}
          />
          <Text
            accessibilityRole="header"
            style={{ color: "white", fontWeight: "600", fontSize: 23 }}
          >
            通信エラー
          </Text>
          <Text
            style={{
              color: "#ffffff99",
              fontSize: 16,
              marginTop: 12,
              marginBottom: 28,
            }}
          >
            {message}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={{
              marginTop: "auto",
              width: "42%",
              borderRadius: 24,
              overflow: "hidden",
              padding: 12,
              alignItems: "center",
            }}
          >
            <BlurView
              pointerEvents="none"
              intensity={85}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <Text
              style={{
                color: "black",
                fontWeight: "600",
                fontSize: 16,
                fontFamily: Platform.OS === "ios" ? "ui-rounded" : undefined,
              }}
            >
              OK
            </Text>
          </Pressable>
        </SmoothSurface>
      </View>
    </Modal>
  );
}
