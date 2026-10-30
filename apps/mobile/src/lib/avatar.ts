import { stripJpegMetadata } from "./jpegMetadata";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File, Paths } from "expo-file-system";
import { native, key, url, streetID } from "./native";
export type Profile = {
  display_name: string;
  avatar_path?: string;
  avatar_updated_at?: string;
  avatar_upload_path: string;
};
export function imageErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message === "image_too_large")
    return "画像を小さくできませんでした。別の写真を選んでください。";
  if (message === "image_conversion_failed")
    return "画像を読み込めませんでした。別の写真を選んでください。";
  if (message === "image_upload_failed")
    return "画像を送信できませんでした。接続を確認して再試行してください。";
  return "保存を確認できませんでした。再読み込みして確認してください。";
}

function discard(file: File | undefined) {
  // A cache cleanup failure must not turn a successful publication into an error.
  try {
    if (file?.exists) file.delete();
  } catch {
    // The OS can reclaim the image cache later.
  }
}

async function chooseImage<T>(
  upload: (file: File) => Promise<T>,
): Promise<T | null> {
  const selection = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    exif: false,
    quality: 1,
  });
  if (selection.canceled) return null;
  try {
    return await convertAndUpload(selection.assets[0].uri, upload);
  } finally {
    // Only the app-owned picker copy may be removed, never the photo library.
    try {
      const selected = new URL(selection.assets[0].uri);
      const cache = new URL(
        "ImagePicker/",
        Paths.cache.uri.replace(/\/?$/, "/"),
      );
      if (selected.protocol === "file:" && selected.href.startsWith(cache.href))
        discard(new File(selected.href));
    } catch {
      // Cleanup must not obscure the upload result.
    }
  }
}

async function convertAndUpload<T>(
  uri: string,
  upload: (file: File) => Promise<T>,
): Promise<T> {
  let output: File | undefined;
  try {
    const context = ImageManipulator.manipulate(uri, {
      maxWidth: 512,
      maxHeight: 512,
    });
    try {
      const image = await context.renderAsync();
      try {
        for (const compress of [0.85, 0.65, 0.4]) {
          const saved = await image.saveAsync({
            format: SaveFormat.JPEG,
            compress,
          });
          output = new File(saved.uri);
          if (output.size > 0 && output.size <= 2097152) break;
          discard(output);
          output = undefined;
        }
      } finally {
        image.release();
      }
    } finally {
      context.release();
    }
  } catch {
    discard(output);
    throw Error("image_conversion_failed");
  }
  if (!output) throw Error("image_too_large");
  try {
    return await upload(output);
  } finally {
    discard(output);
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
  const body = stripJpegMetadata(await file.arrayBuffer());
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
      body,
    },
  ).catch(() => {
    throw Error("image_upload_failed");
  });
  if (!response.ok) throw Error("image_upload_failed");
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
