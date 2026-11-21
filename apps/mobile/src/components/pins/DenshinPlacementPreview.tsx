import { View } from "react-native";
import { DenshinMapPin } from "./DenshinMapPin";
import { onsitePeople } from "../../lib/denshin";
import type { DenshinDraft } from "../../lib/denshinDraft";

export function DenshinPlacementPreview({
  draft,
  name,
  avatar,
}: {
  draft: DenshinDraft;
  name?: string;
  avatar?: string | null;
}) {
  // Match MarkerFeedback's ground-shadow space as well as the visible layout.
  return (
    <View style={{ paddingBottom: 8 }}>
      <DenshinMapPin
        pin={{
          body: draft.body,
          recruiting: draft.recruiting,
          display_name: name ?? "自分",
          avatar_path: avatar ?? undefined,
          count: draft.original?.count ?? 0,
          capacity: draft.limited ? draft.capacity : null,
        }}
        people={draft.original ? onsitePeople(draft.original) : []}
      />
    </View>
  );
}
