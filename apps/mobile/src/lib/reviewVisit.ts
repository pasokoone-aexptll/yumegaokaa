import { uuid } from "expo-modules-core";
import type { NativeState, Visit } from "./native";

export const reviewTag = "33333333-3333-4333-8333-333333333333";
type RPC = <T>(name: string, payload?: Record<string, unknown>) => Promise<T>;
type Current = { visit: Partial<Visit> | null; ghost_preference: boolean; mode_revision: string };

export function reviewVisits(rpc: RPC) {
  const current = () => rpc<Current>("get_my_visit");
  async function state(): Promise<NativeState> {
    const { visit, ghost_preference } = await current();
    return { visit: visit ?? {}, ghost_preference, observing: false, pending_exit: false,
      status: visit?.state === "active" ? "審査デモで入街中" : "未参加" };
  }
  async function fix(visit: Partial<Visit>) {
    const config = await rpc<{ grid_version: string; area_version: string; server_time: string }>(
      "get_street_config", { street_id: visit.street_id },
    );
    return { observed_at: config.server_time, horizontal_accuracy_m: 5, verdict: "inside",
      area_version: config.area_version, seq: (BigInt(visit.last_seq ?? "0") + 1n).toString(),
      cell_id: "0:0", grid_version: config.grid_version };
  }
  return {
    state,
    async enter() {
      const previous = await current();
      if (previous.visit?.state !== "active" || !previous.visit.can_update) {
        const attempt = await rpc<{ attempt_id: string }>("prepare_checkin", { tag_id: reviewTag, payload_version: 1 });
        await rpc("commit_checkin", { attempt_id: attempt.attempt_id });
      }
      const { visit } = await current();
      if (!visit?.can_update || !visit.visit_id) throw Error("inactive_visit");
      if (!visit.ghost) await rpc("observe_visit", { ...(await fix(visit)), visit_id: visit.visit_id, mode_revision: visit.mode_revision });
      return state();
    },
    async stop() {
      const { visit } = await current();
      if (visit?.can_update) await rpc("end_visit", { visit_id: visit.visit_id, reason: "manual" });
      return state();
    },
    async ghost(ghost: boolean) {
      const { visit, mode_revision } = await current();
      const active = visit?.state === "active" ? visit : null;
      await rpc("set_presence_mode", { ghost, request_id: uuid.v4(), mode_revision,
        ...(active && { visit_id: active.visit_id }), ...(active && !ghost && await fix(active)) });
      return state();
    },
  };
}
