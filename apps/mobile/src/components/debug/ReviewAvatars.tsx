import type { ReactNode } from "react";
import { AvatarImageContext } from "../Avatar";
const avatars = {
  nyan_x: require("../../../assets/debug/figma-avatar-1.png"),
  yuu8: require("../../../assets/debug/figma-avatar-0.png"),
  "9memem": require("../../../assets/debug/figma-avatar-6.png"),
  sannlib: require("../../../assets/debug/figma-avatar-4.png"),
  anyonyo: require("../../../assets/debug/figma-avatar-4.png"),
  chainchainchaon: require("../../../assets/debug/figma-avatar-4.png"),
  "329memem": require("../../../assets/debug/figma-avatar-6.png"),
};
export function ReviewAvatars({ children }: { children: ReactNode }) {
  return (
    <AvatarImageContext.Provider value={avatars}>
      {children}
    </AvatarImageContext.Provider>
  );
}
