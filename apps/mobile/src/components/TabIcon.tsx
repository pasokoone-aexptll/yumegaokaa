import { StyleSheet, View } from "react-native";

type Kind = "home" | "map" | "account";

export function TabIcon({
  kind,
  color,
  focused,
}: {
  kind: Kind;
  color: string;
  focused: boolean;
}) {
  const ink = kind === "map" && focused ? "white" : color;
  return (
    <View
      accessible={false}
      pointerEvents="none"
      style={[
        styles.container,
        kind === "map" && focused && styles.mapSelected,
      ]}
    >
      <View style={styles.canvas}>
        {kind === "home" ? (
          <>
            <View style={[styles.roof, { borderColor: ink }]} />
            <View style={[styles.house, { borderColor: ink }]} />
            <View style={[styles.door, { borderColor: ink }]} />
          </>
        ) : kind === "account" ? (
          <>
            <View style={[styles.head, { borderColor: ink }]} />
            <View style={[styles.shoulders, { borderColor: ink }]} />
          </>
        ) : (
          <>
            {([0, 1, 2, 3] as const).map((corner) => (
              <View
                key={corner}
                style={[
                  styles.corner,
                  {
                    borderColor: ink,
                    transform: [{ rotate: `${corner * 90}deg` }],
                  },
                  corner === 0
                    ? { top: 1, left: 1 }
                    : corner === 1
                      ? { top: 1, right: 1 }
                      : corner === 2
                        ? { bottom: 1, right: 1 }
                        : { bottom: 1, left: 1 },
                ]}
              />
            ))}
            <View style={[styles.arrow, { borderBottomColor: ink }]} />
          </>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  mapSelected: { backgroundColor: "#008cff" },
  canvas: { width: 30, height: 30 },
  roof: {
    position: "absolute",
    width: 19,
    height: 19,
    top: 4,
    left: 5.5,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    transform: [{ rotate: "45deg" }],
  },
  house: {
    position: "absolute",
    top: 13,
    left: 5,
    width: 20,
    height: 15,
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  door: {
    position: "absolute",
    bottom: 2,
    left: 11,
    width: 8,
    height: 10,
    borderWidth: 2,
    borderBottomWidth: 0,
  },
  head: {
    position: "absolute",
    top: 1,
    left: 10,
    width: 11,
    height: 11,
    borderWidth: 2.5,
    borderRadius: 6,
  },
  shoulders: {
    position: "absolute",
    left: 3,
    bottom: 2,
    width: 25,
    height: 13,
    borderWidth: 2.5,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  corner: {
    position: "absolute",
    width: 8,
    height: 8,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 3,
  },
  arrow: {
    position: "absolute",
    left: 10,
    top: 6,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 17,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    transform: [{ rotate: "45deg" }],
  },
});
