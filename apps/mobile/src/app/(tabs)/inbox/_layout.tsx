import { Stack } from "expo-router";
export default function InboxStack() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    />
  );
}
