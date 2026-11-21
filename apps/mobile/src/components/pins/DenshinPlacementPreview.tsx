import { Text, View } from "react-native";
import { Avatar } from "../Avatar";
import { RecruitmentGlyph, RecruitmentSign } from "../denshin/PinParts";
import { PinBubble, PinGradientText } from "../map/PinLabel";
import type { DenshinDraft } from "../../lib/denshinDraft";

/** Uses the published PIN assets; opacity belongs to the placement overlay. */
export function DenshinPlacementPreview({
  draft,
  name,
  avatar,
}: {
  draft: DenshinDraft;
  name?: string;
  avatar?: string | null;
}) {
  return (
    <View style={{ alignItems: "center", maxWidth: 210, padding: 8 }}>
      {draft.recruiting && (
        <Text
          style={{
            color: "rgba(255,255,255,0.85)",
            fontFamily: "ui-rounded",
            fontWeight: "700",
            fontSize: 13,
            alignSelf: "flex-start",
            marginLeft: 8,
            marginBottom: 5,
          }}
        >
          {name ?? "自分"} ・{" "}
          <Text style={{ fontSize: 16 }}>{draft.original?.count ?? 0}</Text>
          <Text style={{ fontSize: 10 }}>
            {draft.limited ? `/${draft.capacity}人` : "人"}
          </Text>
        </Text>
      )}
      {!!draft.body.trim() && (
        <View style={{ zIndex: 2 }}>
          <PinBubble>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              {draft.recruiting && <RecruitmentGlyph />}
              <View style={{ flexShrink: 1 }}>
                <PinGradientText
                  colors={draft.recruiting ? undefined : ["#858990", "#a5a7ac"]}
                >
                  {draft.body}
                </PinGradientText>
              </View>
            </View>
          </PinBubble>
        </View>
      )}
      {draft.recruiting ? (
        <View style={{ marginTop: draft.body.trim() ? -30 : 0 }}>
          <RecruitmentSign />
        </View>
      ) : (
        <View
          style={{
            borderWidth: 5,
            borderColor: "rgba(255,255,255,0.25)",
            borderRadius: 18,
          }}
        >
          <Avatar
            shape="square"
            path={avatar ?? undefined}
            name={name ?? "自分"}
            size={54}
          />
        </View>
      )}
    </View>
  );
}
