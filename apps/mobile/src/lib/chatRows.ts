import type { Message } from "../hooks/useStreetChat";
import type { ChatEcho } from "../hooks/useChatComposer";
type Profile = {
  display_name: string;
  avatar_path?: string;
  avatar_updated_at?: string;
};
export type ChatRow = Message & {
  rowKey: string;
  local?: boolean;
  sending?: boolean;
};
/** Keep one React identity through pending -> receipt -> server window. */
export function chatRows(
  items: Message[],
  echoes: ChatEcho[],
  pending: { key: string; created_at: string } | null,
  pendingText: string | null,
  keys: Record<string, string>,
  profile?: Profile,
): ChatRow[] {
  const self =
    profile ?? items.find((item) => item.mine && item.kind === "text");
  const rows: ChatRow[] = [...items].reverse().map((item) => ({
    ...item,
    ...(item.mine && self
      ? {
          avatar_path: self.avatar_path,
          avatar_updated_at: self.avatar_updated_at,
        }
      : {}),
    rowKey: keys[item.id] ?? item.id,
  }));
  const local = (
    key: string,
    id: string,
    body: string,
    created_at: string,
    sending = false,
  ): ChatRow => ({
    id,
    rowKey: key,
    body,
    created_at,
    kind: "text",
    mine: true,
    deleted: false,
    author_id: null,
    display_name: self?.display_name ?? "自分",
    avatar_path: self?.avatar_path,
    avatar_updated_at: self?.avatar_updated_at,
    local: true,
    sending,
  });
  for (const echo of echoes)
    if (!items.some((item) => item.id === echo.id))
      rows.push(local(echo.key, echo.id, echo.body, echo.created_at));
  if (pending && pendingText !== null)
    rows.push(
      local(pending.key, pending.key, pendingText, pending.created_at, true),
    );
  return rows;
}
