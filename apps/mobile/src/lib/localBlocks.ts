// A session-local mask closes the gap between a successful block and pending
// read responses. The server remains authoritative for persisted filtering.
const blocked = new Set<string>();
const listeners = new Set<() => void>();
export const localBlocks = {
  hidden(account: string | null) {
    return account !== null && blocked.has(account);
  },
  set(account: string, hidden: boolean) {
    if (hidden) blocked.add(account);
    else blocked.delete(account);
    listeners.forEach((listener) => listener());
  },
  clear() {
    blocked.clear();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
