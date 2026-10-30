import { localBlocks } from "./localBlocks";
import { clearDraft } from "./pinDraft";

type Session = { signed_in: boolean; email: string };
let state = { ready: false, signed_in: false, email: "", revision: 0 };
const listeners = new Set<() => void>();
export const sessionState = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  publish(session: Session) {
    const email = session.signed_in ? session.email : "";
    const changed =
      state.signed_in !== session.signed_in || state.email !== email;
    if (state.ready && !changed) return;
    if (changed) {
      clearDraft();
      localBlocks.clear();
    }
    state = {
      ready: true,
      signed_in: session.signed_in,
      email,
      revision: state.revision + (changed ? 1 : 0),
    };
    listeners.forEach((listener) => listener());
  },
};
