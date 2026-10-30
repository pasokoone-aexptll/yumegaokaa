import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/lib/avatar.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
function harness(uri, { conversion = false, upload = false } = {}) {
  const removed = [];
  const exports = {};
  class File {
    constructor(uri) {
      this.uri = uri;
      this.exists = true;
      this.size = 100;
    }
    delete() {
      removed.push(this.uri);
    }
    async arrayBuffer() {
      return new ArrayBuffer(1);
    }
  }
  new Function("require", "exports", "fetch", source)(
    (id) => {
      if (id.includes("jpegMetadata")) return { stripJpegMetadata: (x) => x };
      if (id === "expo-image-picker")
        return {
          launchImageLibraryAsync: async () => ({
            canceled: false,
            assets: [{ uri }],
          }),
        };
      if (id === "expo-file-system")
        return { File, Paths: { cache: { uri: "file:///app/cache/" } } };
      if (id === "expo-image-manipulator")
        return {
          SaveFormat: { JPEG: "jpeg" },
          ImageManipulator: {
            manipulate: () => ({
              release() {},
              renderAsync: async () => {
                if (conversion) throw Error("decode");
                return {
                  release() {},
                  saveAsync: async () => ({
                    uri: "file:///app/cache/output.jpg",
                  }),
                };
              },
            }),
          },
        };
      return {
        native: {
          rpc: async () => ({ avatar_upload_path: "profile.jpg" }),
          realtimeToken: async () => "test",
        },
        url: "http://local",
        key: "test",
      };
    },
    exports,
    async () => {
      if (upload) throw Error("offline");
      return { ok: true };
    },
  );
  return { choose: exports.chooseAvatar, removed };
}
test("success removes both app-owned picker and converted copies", async () => {
  const h = harness("file:///app/cache/ImagePicker/photo.jpg");
  await h.choose();
  assert.deepEqual(h.removed, [
    "file:///app/cache/output.jpg",
    "file:///app/cache/ImagePicker/photo.jpg",
  ]);
});
test("conversion and upload failure still remove their temporary copies", async () => {
  for (const mode of [{ conversion: true }, { upload: true }]) {
    const h = harness("file:///app/cache/ImagePicker/photo.jpg", mode);
    await assert.rejects(h.choose());
    assert.ok(h.removed.includes("file:///app/cache/ImagePicker/photo.jpg"));
    if (mode.upload)
      assert.ok(h.removed.includes("file:///app/cache/output.jpg"));
  }
});
test("photo-library and non-picker paths are never removed", async () => {
  for (const uri of [
    "ph://photo",
    "file:///app/Documents/photo.jpg",
    "file:///app/cache/ImagePickerOther/photo.jpg",
    "file:///app/cache/ImagePicker/../private.jpg",
  ]) {
    const h = harness(uri);
    await h.choose();
    assert.deepEqual(h.removed, ["file:///app/cache/output.jpg"]);
  }
});
