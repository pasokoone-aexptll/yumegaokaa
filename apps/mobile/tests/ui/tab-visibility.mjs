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
// Failed access reads must not remove navigation, nor bypass known denials.
assert.equal(shouldShowTabs(true, true, "unknown", false, true), true);
for (const access of ["profile_required", "pool_required", "unregistered", "suspended", "withdrawn", "expired"]) {
  assert.equal(shouldShowTabs(true, true, access, false, true), false);
}
assert.equal(shouldShowTabs(true, false, "unknown", false, true), false);
assert.equal(shouldShowTabs(false, true, "unknown", false, true), false);
assert.equal(shouldShowTabs(true, true, "unknown", true, true), false);
console.log("21 tab visibility assertions passed");
