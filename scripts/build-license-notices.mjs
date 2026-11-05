// Bundle the original notices as text so both mobile platforms can read them offline.
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const sources = [
  ["夢ヶ丘（DreamCloud）", "LICENSE"],
  ["Expo", "apps/mobile/LICENSE"],
  ["Kubai Icons", "apps/mobile/src/components/icons/LICENSE"],
  ["OpenFreeMap styles", "apps/mobile/assets/maps/LICENSE.openfreemap-styles"],
  ["日本語読み辞書（IPADIC）", "apps/mobile/assets/readings/COPYING"],
];
const notices = sources.map(([title, path]) => ({
  title,
  text: readFileSync(new URL(path, root), "utf8"),
}));
writeFileSync(new URL("apps/mobile/src/legal/notices.json", root), JSON.stringify(notices, null, 2) + "\n");
