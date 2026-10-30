// Broadcasts contain no message bodies. Each consumer re-fetches with its own authorization.
const listeners = new Set<() => void>();
export const streetChanges = {
  notify() {
    for (const listener of listeners) listener();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
