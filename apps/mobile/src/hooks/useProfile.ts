import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { native } from "../lib/native";
import { Profile, chooseAvatar, imageErrorMessage } from "../lib/avatar";
export function useProfile() {
  const [profile, setProfile] = useState<Profile>(),
    [name, setName] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let live = true;
      void native
        .rpc<Profile>("profile_get", {})
        .then((p) => {
          if (live) {
            setProfile(p);
            setName(p.display_name);
          }
        })
        .catch(() => {
          if (live) setStatus("プロフィールを取得できません");
        });
      return () => {
        live = false;
      };
    }, []),
  );
  async function perform(action: () => Promise<Profile | null>) {
    setBusy(true);
    setStatus("");
    try {
      const p = await action();
      if (p) {
        setProfile(p);
        setStatus("保存しました");
        return true;
      }
    } catch (e) {
      setStatus(imageErrorMessage(e));
    } finally {
      setBusy(false);
    }
    return false;
  }
  return {
    profile,
    name,
    setName,
    status,
    busy,
    save: () =>
      perform(() =>
        native.rpc<Profile>("profile_save", { display_name: name }),
      ),
    selectAvatar: () => perform(chooseAvatar),
  };
}
