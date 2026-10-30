import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";
import { native, key, url, streetID } from "./native";
export type Profile = {
  display_name: string;
  avatar_path?: string;
  avatar_updated_at?: string;
  avatar_upload_path: string;
};
async function chooseImage<T>(
  upload: (file: File) => Promise<T>,
): Promise<T | null> {
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
    return await upload(output);
  } finally {
    context.release();
    if (output?.exists) output.delete();
  }
}

export async function chooseAvatar(): Promise<Profile | null> {
  return chooseImage(async (file) => {
    const profile = await native.rpc<Profile>("profile_get", {});
    await uploadImage("avatars", profile.avatar_upload_path, file);
    return native.rpc<Profile>("profile_avatar_set", {});
  });
}
export type StreetIconState = {
  contribution_id: string | null;
  contribution_path: string | null;
  daily_path: string | null;
  contributed: boolean;
  day: string;
  next_shuffle_at: string;
};
async function uploadImage(bucket: string, path: string, file: File) {
  const token = await native.realtimeToken();
  const response = await fetch(
    url + "/storage/v1/object/" + bucket + "/" + path,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: "Bearer " + token,
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
      },
      body: await file.arrayBuffer(),
    },
  );
  if (!response.ok) throw Error("avatar_upload_failed");
}
export async function chooseStreetIcon(): Promise<StreetIconState | null> {
  return chooseImage(async (file) => {
    const pending = await native.rpc<{ id: string; upload_path: string }>(
      "street_icon_prepare",
      { street_id: streetID },
    );
    await uploadImage("street-icons", pending.upload_path, file);
    return native.rpc<StreetIconState>("street_icon_publish", {
      street_id: streetID,
      id: pending.id,
    });
  });
}
