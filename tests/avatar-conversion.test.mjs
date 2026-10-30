import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/lib/avatar.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
function harness({
  sizes = [80000],
  canceled = false,
  conversionError = false,
  cleanupError = false,
} = {}) {
  const saved = [],
    deleted = [],
    calls = [];
  let options,
    releases = 0,
    contextReleases = 0;
  class File {
    constructor(uri) {
      this.uri = uri;
      this.size = sizes[Number(uri.split(":")[1])];
      this.exists = true;
    }
    delete() {
      deleted.push(this.uri);
      if (cleanupError) throw Error("cache");
      this.exists = false;
    }
    async arrayBuffer() {
      return new ArrayBuffer(1);
    }
  }
  const exports = {};
  new Function("require", "exports", source)((id) => {
    if (id === "./jpegMetadata") return { stripJpegMetadata: (bytes) => bytes };
    if (id === "expo-image-picker")
      return {
        launchImageLibraryAsync: async (o) => {
          options = o;
          return canceled
            ? { canceled: true }
            : {
                canceled: false,
                assets: [{ uri: "source:large", fileSize: 12000000 }],
              };
        },
      };
    if (id === "expo-file-system") return { File };
    if (id === "expo-image-manipulator")
      return {
        SaveFormat: { JPEG: "jpeg" },
        ImageManipulator: {
          manipulate: () => ({
            release() {
              contextReleases++;
            },
            async renderAsync() {
              if (conversionError) throw Error("decode");
              return {
                release() {
                  releases++;
                },
                async saveAsync(o) {
                  saved.push(o);
                  return { uri: "out:" + (saved.length - 1) };
                },
              };
            },
          }),
        },
      };
    return {
      key: "local-test",
      url: "http://local-test",
      streetID: "street",
      native: {
        realtimeToken: async () => "local-test",
        rpc: async (op) => {
          calls.push(op);
          return { avatar_upload_path: "test", display_name: "test" };
        },
      },
    };
  }, exports);
  return {
    exports,
    saved,
    deleted,
    calls,
    get options() {
      return options;
    },
    get releases() {
      return releases;
    },
    get contextReleases() {
      return contextReleases;
    },
  };
}
test("large source reaches crop and conversion before size validation; cleanup failure does not undo save", async () => {
  const h = harness({ cleanupError: true });
  const old = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true });
  try {
    assert.equal((await h.exports.chooseAvatar()).display_name, "test");
    assert.equal(h.options.allowsEditing, true);
    assert.deepEqual(h.options.aspect, [1, 1]);
    assert.deepEqual(h.calls, ["profile_get", "profile_avatar_set"]);
    assert.equal(h.releases, 1);
    assert.equal(h.contextReleases, 1);
  } finally {
    globalThis.fetch = old;
  }
});
test("oversized encoded results retry compression and never upload when all exceed limit", async () => {
  const h = harness({ sizes: [3000000, 2500000, 2200000] });
  await assert.rejects(() => h.exports.chooseAvatar(), /image_too_large/);
  assert.deepEqual(
    h.saved.map((x) => x.compress),
    [0.85, 0.65, 0.4],
  );
  assert.equal(h.deleted.length, 3);
  assert.deepEqual(h.calls, []);
});
test("cancel is inert and decoding failure releases context without publishing", async () => {
  const cancel = harness({ canceled: true });
  assert.equal(await cancel.exports.chooseAvatar(), null);
  assert.equal(cancel.saved.length, 0);
  const broken = harness({ conversionError: true });
  await assert.rejects(
    () => broken.exports.chooseAvatar(),
    /image_conversion_failed/,
  );
  assert.equal(broken.contextReleases, 1);
  assert.deepEqual(broken.calls, []);
});
test("upload failure is not mislabeled as source size failure", async () => {
  const h = harness();
  const old = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false });
  try {
    await assert.rejects(() => h.exports.chooseAvatar(), /image_upload_failed/);
    assert.equal(h.deleted.length, 1);
    assert.deepEqual(h.calls, ["profile_get"]);
    assert.match(
      h.exports.imageErrorMessage(Error("image_upload_failed")),
      /送信/,
    );
  } finally {
    globalThis.fetch = old;
  }
});
