import { useRef, useState, type ComponentRef } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { MapAsset } from "./MapAsset";
import { SmoothSurface } from "./SmoothSurface";

export function ModeDropdown({ ghost, active, disabled, onChange }: {
  ghost: boolean;
  active: boolean;
  disabled: boolean;
  onChange?: (ghost: boolean) => void;
}) {
  const button = useRef<ComponentRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<{ right: number; top: number } | null>(null);
  const [progress] = useState(() => new Animated.Value(0));
  const { width } = useWindowDimensions();
  const animate = (open: boolean) => Animated.timing(progress, {
    toValue: open ? 1 : 0, duration: open ? 200 : 140,
    easing: Easing.out(Easing.cubic), useNativeDriver: true,
  });
  function close() {
    animate(false).start(({ finished }) => { if (finished) setAnchor(null); });
  }
  return (
    <View ref={button} collapsable={false}>
      <Pressable disabled={disabled || !onChange} accessibilityRole="button"
        accessibilityLabel={`気配の公開設定：${ghost ? "ゴースト" : "通常"}`}
        accessibilityState={{ expanded: !!anchor, disabled: disabled || !onChange }}
        onPress={() => button.current?.measureInWindow((x, y, w, h) => {
          progress.setValue(0);
          setAnchor({ right: Math.max(8, width - x - w), top: y + h + 6 });
        })}>
        <SmoothSurface color="#ffffff26" blurIntensity={25} radius={12} style={styles.trigger}>
          <View style={[styles.dot, { backgroundColor: ghost ? "#9a9a9e" : active ? "#00bc83" : "#ffffff66" }]} />
          <Animated.View style={{ transform: [{ rotate: progress.interpolate({ inputRange: [0,1], outputRange: ["90deg","-90deg"] }) }] }}>
            <MapAsset name="chevron.right" size={16} />
          </Animated.View>
        </SmoothSurface>
      </Pressable>
      {anchor && <Modal transparent visible statusBarTranslucent onShow={() => animate(true).start()} onRequestClose={close}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="メニューを閉じる" onPress={close} />
        <Animated.View accessibilityViewIsModal style={[styles.menu, anchor, { opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0,1], outputRange: [-9,0] }) },
            { scale: progress.interpolate({ inputRange: [0,1], outputRange: [0.96,1] }) }] }]}>
          <SmoothSurface radius={18} color="#000000cc" blurIntensity={28} style={{ padding: 8 }}>
            {[false,true].map((option) => (
              <Pressable key={String(option)} accessibilityRole="radio" accessibilityState={{ checked: ghost === option, disabled }}
                disabled={disabled} onPress={() => { close(); if (option !== ghost) onChange?.(option); }}
                style={({ pressed }) => [styles.option, { backgroundColor: pressed || option === ghost ? "#ffffff20" : "transparent" }]}>
                <View style={[styles.dot, { backgroundColor: option ? "#9a9a9e" : "#00bc83" }]} />
                <Text style={styles.label}>{option ? "ゴーストモード" : "通常モード"}</Text>
                {option === ghost && <Text accessibilityElementsHidden style={styles.label}>✓</Text>}
              </Pressable>
            ))}
            <Text style={styles.note}>ゴースト中は人数に含まれ、気配を隠して募集を終了します。投稿やイベントには名前が表示されます。設定は次の入街にも引き継ぎます。</Text>
          </SmoothSurface>
        </Animated.View>
      </Modal>}
    </View>
  );
}
const styles = StyleSheet.create({
  trigger: { width:64,height:38,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:4 },
  dot: { width:14,height:14,borderRadius:7 },
  menu: { position:"absolute",width:228,maxWidth:"94%" },
  option: { minHeight:46,borderRadius:11,paddingHorizontal:12,flexDirection:"row",alignItems:"center",gap:10 },
  label: { color:"white",fontSize:15,fontWeight:"600" },
  note: { color:"#dddddf",fontSize:12,lineHeight:18,margin:8 },
});
