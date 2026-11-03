import assert from "node:assert/strict";
import { shouldShowTabs } from "../../src/lib/tabVisibility.ts";
for (const access of [
  "unknown",
  "profile_required",
  "pool_required",
  "unregistered",
  "suspended",
  "withdrawn",
  "expired",
]) {
  assert.equal(shouldShowTabs(true, true, access, false), false, access);
}
assert.equal(shouldShowTabs(false, false, "active", false), false);
assert.equal(shouldShowTabs(true, false, "active", false), false);
assert.equal(shouldShowTabs(true, true, "active", true), false);
assert.equal(shouldShowTabs(true, true, "active", false), true);
console.log("11 tab visibility assertions passed");
