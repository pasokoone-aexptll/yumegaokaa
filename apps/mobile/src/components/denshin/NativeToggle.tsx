import { Platform, Switch } from "react-native";
import { NativeToggle as AndroidToggle } from "./NativeToggle.android";

export const NativeToggle = Platform.OS === "android" ? AndroidToggle : Switch;
