import { createServer } from "node:http";
import { execFileSync, spawn } from "node:child_process";
import assert from "node:assert/strict";
const container = "supabase_kong_yumegaoka";
let offline = false;
const online = () => {
  if (offline) {
    execFileSync("docker", ["start", container], { stdio: "ignore" });
    offline = false;
  }
};
const server = createServer((req, res) => {
  try {
    if (req.method !== "POST") {
      res.writeHead(405).end();
      return;
    }
    if (req.url === "/offline") {
      offline = true;
      execFileSync("docker", ["stop", "--time", "1", container], {
        stdio: "ignore",
      });
    } else if (req.url === "/online") online();
    else {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200).end("ok");
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
});
await new Promise((r) => server.listen(54326, "127.0.0.1", r));
const watchdog = setTimeout(online, 180000);
try {
  const child = spawn(
    "xcodebuild",
    [
      "-project",
      "tests/ios-ui/Smoke.xcodeproj",
      "-scheme",
      "Smoke",
      "-destination",
      "platform=iOS Simulator,id=6410E701-1891-45E2-B35D-CB42F5891EF8",
      "-derivedDataPath",
      "/tmp/yumegaoka-ui-release",
      "-resultBundlePath",
      process.env.UI_RESULT_PATH ?? "/tmp/yumegaoka-offline117.xcresult",
      "-collect-test-diagnostics",
      "never",
      "-only-testing:Smoke/Smoke/testOfflineExitRecovery",
      "test",
    ],
    { stdio: "inherit" },
  );
  const status = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", resolve);
  });
  assert.equal(status, 0);
} finally {
  clearTimeout(watchdog);
  online();
  server.close();
}
