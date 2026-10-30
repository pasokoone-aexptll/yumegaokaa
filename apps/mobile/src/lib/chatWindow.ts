export type ChatCursor = { id: string; created_at: string };
function atOrBefore(a: ChatCursor, b: ChatCursor) {
  return (
    a.created_at < b.created_at ||
    (a.created_at === b.created_at && a.id <= b.id)
  );
}
// Re-read the visible window, including all intervening pages after a disconnect.
// Replacement (rather than merging old rows) also removes blocked/expired rows.
export async function readChatWindow<T extends ChatCursor>(
  fetchPage: (cursor?: ChatCursor) => Promise<T[]>,
  oldest: ChatCursor | undefined,
  cancelled: () => boolean,
): Promise<T[] | null> {
  const rows = new Map<string, T>();
  let cursor: ChatCursor | undefined;
  while (!cancelled()) {
    const page = await fetchPage(cursor);
    if (cancelled()) return null;
    for (const row of page) rows.set(row.id, row);
    const last = page.at(-1);
    if (!oldest || page.length < 50 || !last || atOrBefore(last, oldest))
      return [...rows.values()].filter(
        (row) => !oldest || atOrBefore(oldest, row),
      );
    if (cursor && !atOrBefore(last, cursor)) throw Error("invalid_chat_cursor");
    if (cursor?.id === last.id) throw Error("repeated_chat_cursor");
    cursor = last;
  }
  return null;
}
