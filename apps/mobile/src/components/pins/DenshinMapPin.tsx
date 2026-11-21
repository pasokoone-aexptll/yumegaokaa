import { BlurView } from "expo-blur";
import { Text, View } from "react-native";
import { Avatar } from "../Avatar";
import {
  PeopleStack,
  RecruitmentSign,
  RecruitmentGlyph,
} from "../denshin/PinParts";
import { PinBubble, PinGradientText } from "../map/PinLabel";
import type { DenshinPin, PinPerson } from "../../lib/denshin";

/** Identical layout for the placement preview and the published annotation. */
export function DenshinMapPin({
  pin,
  people = [],
}: {
  pin: Pick<
    DenshinPin,
    | "body"
    | "recruiting"
    | "display_name"
    | "count"
    | "capacity"
    | "avatar_path"
  >;
  people?: PinPerson[];
}) {
  return (
    <View style={{ alignItems: "center", maxWidth: 210, padding: 8 }}>
      {pin.recruiting && (
        <Text
          numberOfLines={1}
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
          {pin.display_name} ・{" "}
          <Text style={{ fontSize: 16 }}>{pin.count}</Text>
          <Text style={{ fontSize: 10 }}>
            {pin.capacity === null ? "人" : `/${pin.capacity}人`}
          </Text>
        </Text>
      )}
      {!!pin.body.trim() && (
        <View
          style={{
            zIndex: 3,
            alignSelf: "center",
            alignItems: "center",
          }}
        >
          <PinBubble>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              {pin.recruiting && <RecruitmentGlyph />}
              <View style={{ flexShrink: 1 }}>
                <PinGradientText
                  colors={pin.recruiting ? undefined : ["#858990", "#a5a7ac"]}
                >
                  {pin.body}
                </PinGradientText>
              </View>
            </View>
          </PinBubble>
          {pin.recruiting && (
            <View
              style={{
                position: "absolute",
                right: -10,
                bottom: -5,
                zIndex: 4,
              }}
            >
              <PeopleStack people={people} />
            </View>
          )}
        </View>
      )}
      {pin.recruiting ? (
        <View
          style={{
            alignSelf: "center",
            marginTop: pin.body.trim() ? -30 : 0,
          }}
        >
          <RecruitmentSign />
        </View>
      ) : (
        <View
          style={{
            padding: 5,
            overflow: "hidden",
            borderCurve: "continuous",
            borderRadius: 18,
          }}
        >
          <BlurView
            pointerEvents="none"
            intensity={45}
            tint="default"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            }}
          />
          <Avatar
            shape="square"
            path={pin.avatar_path}
            name={pin.display_name}
            size={54}
          />
        </View>
      )}
    </View>
  );
}
