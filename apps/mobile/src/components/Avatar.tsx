import { sessionState } from "../lib/sessionState";
import { SuperAsset } from "./icons/SuperAsset";
import { RefreshMarker } from "./map/markerScale";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Image as LocalImage,
  View,
  type ImageSourcePropType,
} from "react-native";
import { Image, type ImageRef } from "expo-image";
import { cachedAvatar, loadAvatar } from "../lib/avatarImages";

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
  onReady,
}: {
  path?: string;
  version?: string;
  name: string;
  size?: number;
  bucket?: "avatars" | "street-icons";
  shape?: "circle" | "square";
  onReady?: () => void;
}) {
  const refreshMarker = useContext(RefreshMarker);
  const localImage = useContext(AvatarImageContext)[name];
  const session = useSyncExternalStore(
    sessionState.subscribe,
    () => sessionState.get().revision,
  );
  const identity = JSON.stringify([session, bucket, path, version]);
  const [image, setImage] = useState<{ identity: string; source?: ImageRef }>(
    () => ({
      identity,
      source: path ? cachedAvatar(bucket, path, version) : undefined,
    }),
  );
  const [failed, setFailed] = useState("");
  useEffect(() => {
    let live = true;
    if (path && !localImage) {
      void loadAvatar(bucket, path, version)
        .then((source) => {
          if (live) setImage({ identity, source });
        })
        .catch(() => {
          if (live) setFailed(identity);
        });
    }
    return () => {
      live = false;
    };
  }, [identity, path, bucket, version, localImage]);
  useEffect(() => {
    if (
      (!path && !localImage) ||
      failed === identity ||
      (image.identity === identity && image.source)
    )
      onReady?.();
  }, [path, localImage, failed, identity, image, onReady]);

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
        <LocalImage
          source={localImage}
          onLoad={onReady}
          onError={onReady}
          style={[style, { position: "absolute" }]}
        />
      )}
      {path && image.identity === identity && image.source && (
        <Image
          source={image.source}
          style={[style, { position: "absolute" }]}
          contentFit="cover"
          transition={0}
          onDisplay={() => {
            refreshMarker?.();
            onReady?.();
          }}
        />
      )}
    </View>
  );
}
