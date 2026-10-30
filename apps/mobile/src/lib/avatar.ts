import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";
import { native, key, url } from "./native";
export type Profile = {
  display_name: string;
  avatar_path?: string;
  avatar_updated_at?: string;
  avatar_upload_path: string;
};
export async function chooseAvatar(): Promise<Profile | null> {
  const selection = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    exif: false,
    quality: 1,
  });
  if (selection.canceled) return null;
  const asset = selection.assets[0],
    source = new File(asset.uri);
  if (source.size > 2097152) throw Error("image_too_large");
  const context = ImageManipulator.manipulate(asset.uri, {
    maxWidth: 512,
    maxHeight: 512,
  });
  let output: File | undefined;
  try {
    const image = await context.renderAsync();
    const saved = await image.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.85,
    });
    image.release();
    output = new File(saved.uri);
    if (output.size > 2097152) throw Error("image_too_large");
    const profile = await native.rpc<Profile>("profile_get", {}),
      token = await native.realtimeToken();
    const response = await fetch(
      url + "/storage/v1/object/avatars/" + profile.avatar_upload_path,
      {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: "Bearer " + token,
          "Content-Type": "image/jpeg",
          "x-upsert": "true",
        },
        body: await output.arrayBuffer(),
      },
    );
    if (!response.ok) throw Error("avatar_upload_failed");
    return await native.rpc<Profile>("profile_avatar_set", {});
  } finally {
    context.release();
    if (output?.exists) output.delete();
  }
}
