import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { native, key, url } from "../lib/native";
export function Avatar({
  path,
  version,
  name,
  size = 40,
}: {
  path?: string;
  version?: string;
  name: string;
  size?: number;
}) {
  const [token, setToken] = useState("");
  useEffect(() => {
    let live = true;
    void native
      .realtimeToken()
      .then((t) => {
        if (live) setToken(t);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [path, version]);
  const style = { width: size, height: size, borderRadius: size / 2 };
  return path && token ? (
    <Image
      style={style}
      source={{
        uri:
          url +
          "/storage/v1/object/authenticated/avatars/" +
          path +
          "?v=" +
          encodeURIComponent(version ?? ""),
        headers: { apikey: key, Authorization: "Bearer " + token },
        cache: "reload",
      }}
    />
  ) : (
    <View
      style={[
        style,
        {
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#deeff8",
        },
      ]}
    >
      <Text>{Array.from(name)[0] ?? "●"}</Text>
    </View>
  );
}
