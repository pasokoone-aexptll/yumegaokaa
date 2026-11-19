import { SuperAsset } from "./icons/SuperAsset";
import { RefreshMarker } from "./map/markerScale";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Image, View, type ImageSourcePropType } from "react-native";
import { native, key, url } from "../lib/native";
// Scoped local image sources for isolated presentation previews; no auth adapter override.
export const AvatarImageContext = createContext<
  Record<string, ImageSourcePropType>
>({});

export function Avatar({
  path,
  version,
  name,
  size = 40,
  bucket = "avatars",
  shape = "circle",
}: {
  path?: string;
  version?: string;
  name: string;
  size?: number;
  bucket?: "avatars" | "street-icons";
  shape?: "circle" | "square";
}) {
  const refreshMarker = useContext(RefreshMarker);
  const localImage = useContext(AvatarImageContext)[name];
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

  const style = {
    width: size,
    height: size,
    borderRadius: shape === "square" ? size * 0.22 : size / 2,
  };
  return (
    <View
      accessibilityLabel={name || undefined}
      style={[
        style,
        {
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255,255,255,0.15)",
          overflow: "hidden",
        },
      ]}
    >
      <SuperAsset
        name={bucket === "street-icons" ? "myCityPoolIcon" : "user"}
        size={size * 0.65}
        tint={bucket === "street-icons" ? undefined : "black"}
        opacity={0.25}
      />
      {localImage && (
        <Image source={localImage} style={[style, { position: "absolute" }]} />
      )}
      {path &&
        image.identity === identity &&
        image.token &&
        failed !== identity && (
          <Image
            key={identity + ":" + image.attempt}
            style={[style, { position: "absolute" }]}
            onLoadEnd={refreshMarker}
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
