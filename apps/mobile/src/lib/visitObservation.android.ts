import { requireNativeModule } from "expo-modules-core";
import type { Visit } from "./native";
import { observationTime } from "./observationTime";
import { classifyStreetPoint, projectStreetPoint } from "./streetGrid";

type Fix = { visit: string; latitude: number; longitude: number; accuracy: number; elapsed: number };
type RPC = <T>(operation: string, payload?: Record<string, unknown>) => Promise<T>;
const service = requireNativeModule<{
  observeVisit(id: string, remainingMs: number): Promise<boolean>;
  stopObserving(): Promise<void>;
  monotonicTime(): number;
  addListener(name: "onVisitFix", listener: (fix: Fix) => void): { remove(): void };
}>("PresenceNative");

let active: Partial<Visit> | undefined;
let subscription: ReturnType<typeof service.addListener> | undefined;
let lastCell: string | undefined;
let lastSent = -Infinity;
let outsideSince: number | undefined;
let areaVersion: string | undefined;

function reset() {
  outsideSince = undefined;
  lastCell = undefined;
  lastSent = -Infinity;
  areaVersion = undefined;
}

export async function stopObservation() {
  active = undefined;
  reset();
  subscription?.remove();
  subscription = undefined;
  await service.stopObserving();
}

export async function watchVisit(visit: Partial<Visit>, serverTime: string, receive: (fix: Fix) => void) {
  const remaining = Date.parse(visit.expires_at ?? "") - Date.parse(serverTime);
  if (!visit.visit_id || !visit.can_update || visit.state !== "active" || !(remaining > 0)) {
    await stopObservation();
    return false;
  }
  if (visit.visit_id !== active?.visit_id || visit.mode_revision !== active?.mode_revision) reset();
  active = visit;
  subscription?.remove();
  subscription = service.addListener("onVisitFix", receive);
  return service.observeVisit(visit.visit_id, remaining).catch(() => false);
}

export async function observeFix(fix: Fix, rpc: RPC) {
  const visit = active;
  if (!visit || fix.visit !== visit.visit_id) return;
  const before = service.monotonicTime();
  if (before - fix.elapsed > 120000 || fix.accuracy > 50) { outsideSince = undefined; return; }
  const config = await rpc<{ polygon: {coordinates: number[][][]}; area_version: string; grid_version: string; server_time: string }>(
    "get_street_config", { street_id: visit.street_id });
  const observed = observationTime(fix.elapsed, before, service.monotonicTime(), config.server_time);
  if (config.area_version !== areaVersion) { reset(); areaVersion = config.area_version; }
  const point = projectStreetPoint(fix.longitude, fix.latitude);
  let cell = classifyStreetPoint(point, config.polygon.coordinates, fix.accuracy);
  if (!cell) { outsideSince = undefined; return; }
  const outside = cell === "outside";
  if (outside) {
    if (outsideSince === undefined || fix.elapsed - outsideSince > 120000) outsideSince = fix.elapsed;
    if (fix.elapsed - outsideSince < 30000) return;
  } else {
    outsideSince = undefined;
    if (lastCell && fix.elapsed - lastSent < 600000) {
      const [x, y] = lastCell.split(":").map(Number);
      if (point[0] > x * 100 - 20 && point[0] < x * 100 + 120 &&
          point[1] > y * 100 - 20 && point[1] < y * 100 + 120) cell = lastCell;
    }
    if (fix.elapsed - lastSent < (cell === lastCell ? 180000 : 30000)) return;
  }
  const result = await rpc<{result: string; visit: Partial<Visit>; server_time: string}>("observe_visit", {
    visit_id: fix.visit, mode_revision: visit.mode_revision ?? "0",
    seq: (BigInt(visit.last_seq ?? "0") + 1n).toString(), area_version: config.area_version,
    horizontal_accuracy_m: fix.accuracy, observed_at: observed, verdict: outside ? "outside" : "inside",
    ...(!outside && !visit.ghost ? { cell_id: cell, grid_version: config.grid_version } : {}),
  });
  if (result.result === "ended") {
    await stopObservation();
    return result.visit;
  }
  active = result.visit;
  if (result.result === "accepted") {
    lastSent = fix.elapsed;
    lastCell = cell;
    await service.observeVisit(fix.visit, Date.parse(result.visit.expires_at ?? "") - Date.parse(result.server_time));
  }
}

export function observationFailed() { outsideSince = undefined; }
