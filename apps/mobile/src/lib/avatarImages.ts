import { Image, type ImageRef } from "expo-image";
import { native, key, url } from "./native";
import { sessionState } from "./sessionState";

const images = new Map<string, ImageRef>();
const pending = new Map<string, Promise<ImageRef>>();
let revision = sessionState.get().revision;
function identity(bucket: string, path: string, version?: string) {
  const current = sessionState.get().revision;
  if (revision !== current) {
    revision = current;
    images.clear();
    pending.clear();
  }
  return JSON.stringify([url, current, bucket, path, version]);
}
export function cachedAvatar(bucket: string, path: string, version?: string) {
  return images.get(identity(bucket, path, version));
}
export function loadAvatar(bucket: string, path: string, version?: string) {
  const id = identity(bucket, path, version);
  const cached = images.get(id);
  if (cached) return Promise.resolve(cached);
  const existing = pending.get(id);
  if (existing) return existing;
  const session = revision;
  const origin = url, publicKey = key;
  const request = (async () => {
    // Retry once with a fresh token, but share both attempts across all rows.
    for (let attempt = 0; ; attempt++) {
      try {
        const token = await native.realtimeToken();
        if (sessionState.get().revision !== session || url !== origin) throw Error("session_changed");
        const image = await Image.loadAsync({
          uri: `${origin}/storage/v1/object/authenticated/${bucket}/${path}?v=${encodeURIComponent(version ?? "")}`,
          headers: { apikey: publicKey, Authorization: `Bearer ${token}` },
          cacheKey: id,
        });
        if (sessionState.get().revision === session) {
          images.set(id, image);
          if (images.size > 128) images.delete(images.keys().next().value!);
        }
        return image;
      } catch (error) {
        if (attempt || sessionState.get().revision !== session) throw error;
      }
    }
  })().finally(() => {
    if (pending.get(id) === request) pending.delete(id);
  });
  pending.set(id, request);
  return request;
}
