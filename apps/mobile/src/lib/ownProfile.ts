import { sessionState } from "./sessionState";
import { loadAvatar } from "./avatarImages";
type OwnProfile = {
  display_name: string;
  avatar_path?: string;
  avatar_updated_at?: string;
};
let profile: OwnProfile | undefined;
let revision = sessionState.get().revision;
const listeners = new Set<() => void>();
sessionState.subscribe(() => {
  if (revision === sessionState.get().revision) return;
  revision = sessionState.get().revision;
  profile = undefined;
  listeners.forEach((listener) => listener());
});
export const ownProfile = {
  get: () => profile,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  publish(value: OwnProfile, session = sessionState.get().revision) {
    if (session !== sessionState.get().revision) return;
    profile = value;
    if (value.avatar_path)
      void loadAvatar(
        "avatars",
        value.avatar_path,
        value.avatar_updated_at,
      ).catch(() => {});
    listeners.forEach((listener) => listener());
  },
};
