import QRCode from "qrcode";
import assets from "../components/icons/superassets.json";

export function invitePayload(code: string) {
  return `yumegaoka://invite?code=${encodeURIComponent(code)}`;
}
export function parseInviteQR(value: string): string | null {
  try {
    const url = new URL(value);
    const code = url.searchParams.get("code");
    return url.protocol === "yumegaoka:" &&
      url.hostname === "invite" &&
      code &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        code,
      )
      ? code
      : null;
  } catch {
    return null;
  }
}
/** Four-module quiet zone; H correction; central white backing, no finder coverage. */
export function inviteSvg(code: string): string {
  const { modules } = QRCode.create(invitePayload(code), {
    errorCorrectionLevel: "H",
  });
  const n = modules.size,
    q = 4,
    side = n + q * 2;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}"><rect width="${side}" height="${side}" rx="4" fill="white"/>`,
  ];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (!modules.get(y, x)) continue;
      const finder =
        (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      if (finder) continue;
      const dark = (dx: number, dy: number) =>
        dx >= 0 && dy >= 0 && dx < n && dy < n && !!modules.get(dy, dx);
      const r = 0.42,
        X = x + q,
        Y = y + q;
      const tl = !dark(x - 1, y) && !dark(x, y - 1) ? r : 0;
      const tr = !dark(x + 1, y) && !dark(x, y - 1) ? r : 0;
      const br = !dark(x + 1, y) && !dark(x, y + 1) ? r : 0;
      const bl = !dark(x - 1, y) && !dark(x, y + 1) ? r : 0;
      parts.push(
        `<path d="M${X + tl} ${Y}H${X + 1 - tr}Q${X + 1} ${Y} ${X + 1} ${Y + tr}V${Y + 1 - br}Q${X + 1} ${Y + 1} ${X + 1 - br} ${Y + 1}H${X + bl}Q${X} ${Y + 1} ${X} ${Y + 1 - bl}V${Y + tl}Q${X} ${Y} ${X + tl} ${Y}Z" fill="#00AF6B"/>`,
      );
    }
  for (const [x, y] of [
    [q, q],
    [q + n - 7, q],
    [q, q + n - 7],
  ]) {
    parts.push(
      `<rect x="${x}" y="${y}" width="7" height="7" rx="1.5" fill="#00AF6B"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx="1" fill="white"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.6" fill="#00AF6B"/>`,
    );
  }
  const size = Math.floor(n * 0.28),
    left = (side - size) / 2;
  parts.push(
    `<rect x="${left - 0.5}" y="${left - 0.5}" width="${size + 1}" height="${size + 1}" rx="1" fill="white"/>`,
  );
  // Explicit group transform also works in react-native-svg, where nested SVG
  // viewport x/y placement differs from browser rendering.
  const scale = size / 79;
  const figure = assets["非常口の人物"]
    .replace(/<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "");
  const x = left + (size - 65 * scale) / 2;
  parts.push(
    `<g transform="translate(${x} ${left}) scale(${scale}) translate(-24 -10)">${figure}</g>`,
    "</svg>",
  );
  return parts.join("");
}
