import { SheetSurface } from "./SheetSurface";
import { Stack } from "expo-router";
import { View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PinSheetFooterProps } from "./PinSheetFooter";

// RN Screens positions this native footer at the visible sheet edge, including
// detent changes and the keyboard. Keep the existing action callbacks/appearance.
export function PinSheetFooter({ active, children }: PinSheetFooterProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <Stack.Screen
      options={{
        unstable_sheetFooter: () =>
          active ? (
            <View
              collapsable={false}
              renderToHardwareTextureAndroid
              style={{
                width,
                height: 100 + insets.bottom,
                backgroundColor: "transparent",
              }}
              pointerEvents="box-none"
            >
              <SheetSurface />
              <View style={{ height: 100 }} pointerEvents="box-none">
                {children}
              </View>
            </View>
          ) : null,
      }}
    />
  );
}
