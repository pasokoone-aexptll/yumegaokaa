import { UIIcon } from "./icons/UIIcon";
import { useEffect, useRef, useState } from "react";
import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "sf-symbols-typescript";
import { avatarInitial } from "../lib/avatarInitial";
import { Image, Platform, Text, View } from "react-native";
import { native, key, url } from "../lib/native";

export function Avatar({
  path,
  version,
  name,
  size = 40,
  bucket = "avatars",
}: {
  path?: string;
  version?: string;
  name: string;
  size?: number;
  bucket?: "avatars" | "street-icons";
}) {
  const identity = JSON.stringify([bucket, path, version]);
  const [image, setImage] = useState({ identity: "", token: "", attempt: 0 });
  const [failed, setFailed] = useState("");
  const generation = useRef(0);
  const retried = useRef(false);
  const currentIdentity = useRef(identity);
  useEffect(() => {
    const lifecycle = generation;
    const current = ++lifecycle.current;
    currentIdentity.current = identity;
    retried.current = false;
    if (path) {
      void native
        .realtimeToken()
        .then((token) => {
          if (current === generation.current) {
            setFailed("");
            setImage({ identity, token, attempt: 0 });
          }
        })
        .catch(() => {});
    }
    return () => {
      lifecycle.current++;
      currentIdentity.current = "";
    };
  }, [identity, path]);

  async function retry() {
    if (currentIdentity.current !== identity) return;
    if (retried.current) {
      setFailed(identity);
      return;
    }
    retried.current = true;
    const current = generation.current;
    try {
      const token = await native.realtimeToken();
      if (current === generation.current)
        setImage({ identity, token, attempt: 1 });
    } catch {
      if (current === generation.current) setFailed(identity);
    }
  }

  const initial = bucket === "avatars" ? avatarInitial(name) : undefined;
  const style = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View
      style={[
        style,
        {
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#deeff8",
          overflow: "hidden",
        },
      ]}
    >
      {bucket === "street-icons" ? (
        <UIIcon name="presence-star" size={size * 0.7} />
      ) : initial && Platform.OS === "ios" ? (
        <SymbolView name={initial.toLowerCase() as SFSymbol} tintColor="rgba(0,0,0,0.06)" weight="black"
          size={size * 0.65} style={{ width: size * 0.72, height: size * 0.72 }} />
      ) : initial ? (
        <Text allowFontScaling={false} style={{ fontSize: size * 0.65, lineHeight: size * 0.92, fontWeight: "900", includeFontPadding: false, color: "rgba(0,0,0,0.06)" }}>{initial}</Text>
      ) : (
        <UIIcon name="user" size={size * 0.7} />
      )}
      {path &&
        image.identity === identity &&
        image.token &&
        failed !== identity && (
          <Image
            key={identity + ":" + image.attempt}
            style={[style, { position: "absolute" }]}
            onError={() => void retry()}
            source={{
              uri:
                url +
                "/storage/v1/object/authenticated/" +
                bucket +
                "/" +
                path +
                "?v=" +
                encodeURIComponent(version ?? ""),
              headers: { apikey: key, Authorization: "Bearer " + image.token },
              cache: "reload",
            }}
          />
        )}
    </View>
  );
}
