import dictionary from "../../assets/readings/initials.json";

const prefixes: Record<string, string> = dictionary.prefixes;

export function avatarInitial(name: string): string | undefined {
  const clean = name.normalize("NFKC").trim();
  const letter = clean.normalize("NFD").replace(/\p{M}/gu, "").match(/^[a-z]/i)?.[0];
  if (letter) return letter.toUpperCase();
  const kana = clean.replace(/^[ぁ-ゖ]+/, run => run.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60))).replace(/^ッ+/, "");
  for (let n = Math.min(kana.length, dictionary.maxLength); n > 0; n--) {
    const value = prefixes[kana.slice(0, n)];
    if (typeof value === "string") return value;
  }
  return undefined;
}
