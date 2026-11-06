type Author = { author_id: string | null; display_name: string; deleted: boolean; mine: boolean; kind: string };
export type Recipient = { id: string; name: string };

export function chatAuthors(messages: Author[]): Recipient[] {
  const seen = new Map<string, Recipient>();
  for (const m of messages) {
    if (m.kind === "text" && !m.mine && !m.deleted && m.author_id && m.display_name && !seen.has(m.author_id))
      seen.set(m.author_id, { id: m.author_id, name: m.display_name });
  }
  return [...seen.values()];
}

export function mentionParts(text: string, names: string[]) {
  const options = [...new Set(names.filter(Boolean))].sort((a,b) => b.length - a.length);
  const parts: { text: string; name?: string }[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (!"@＠".includes(text[i]) || (i && /[\w.]/.test(text[i-1]))) continue;
    const name = options.find(n => text.startsWith(n, i+1) && !/[a-zA-Z0-9_]/.test(text[i+1+n.length] ?? ""));
    if (!name) continue;
    if (start < i) parts.push({ text: text.slice(start,i) });
    start = i + name.length + 1;
    parts.push({ text: text.slice(i,start), name });
    i = start-1;
  }
  if (start < text.length) parts.push({ text: text.slice(start) });
  return parts;
}

export function resolveMentions(text: string, selected: Recipient[], authors: Recipient[]) {
  const result = new Map(selected.map(r => [r.id,r]));
  for (const part of mentionParts(text, authors.map(a => a.name))) {
    if (!part.name || selected.some(r => r.name === part.name)) continue;
    const matches = authors.filter(a => a.name === part.name);
    if (matches.length > 1) throw Error("同じ表示名の投稿者がいます。投稿者の名前をタップして宛先を選んでください。");
    result.set(matches[0].id, matches[0]);
  }
  if (result.size > 5) throw Error("一度にメンションできるのは5人までです。");
  return [...result.values()];
}
