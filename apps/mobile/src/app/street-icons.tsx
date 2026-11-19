import { useCallback, useContext, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Image, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Action, ui } from "../components/Page";
import { DetailPage, DetailRow, Section } from "../components/DetailUI";
import { SpeechBubble } from "../components/denshin/SpeechBubble";
import { SuperAsset } from "../components/icons/SuperAsset";
import { NativeAction } from "../components/denshin/NativeAction";
import { Avatar } from "../components/Avatar";
import { AccountAccessContext } from "../hooks/useAccountAccess";
import {
  chooseStreetIcon,
  imageErrorMessage,
  StreetIconState,
} from "../lib/avatar";
import { native, streetID } from "../lib/native";

export default function StreetIcons() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const access = useContext(AccountAccessContext);
  const [state, setState] = useState<StreetIconState>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      let live = true;
      const load = () =>
        void native
          .rpc<StreetIconState>("street_icon_get", { street_id: streetID })
          .then((s) => {
            if (live) {
              setState(s);
              setError("");
            }
          })
          .catch(() => {
            if (live) setError("アイコンを取得できませんでした。");
          });
      load();
      const timer = setInterval(load, 30000);
      return () => {
        live = false;
        clearInterval(timer);
      };
    }, []),
  );
  async function update() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await chooseStreetIcon();
      if (result) {
        setState(result);
        access.retry();
      }
    } catch (error) {
      setError(imageErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const editing = edit === "1" || access.status === "pool_required";
  return (
    <DetailPage
      bottomPadding={26}
      title={editing ? "画像を差し替える" : ""}
      titleColor={editing ? "white" : undefined}
      background={
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 390,
          }}
        >
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="pool-sky" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#008CFF" stopOpacity={0.9} />
                <Stop offset="1" stopColor="#008CFF" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#pool-sky)" />
          </Svg>
        </View>
      }
    >
      {!editing && (
        <View style={{ marginTop: -38, gap: 12 }}>
          <Image
            source={require("../../assets/superassets/気配sample.png")}
            style={{ width: 250, height: 125, marginLeft: 10 }}
            resizeMode="contain"
            accessible={false}
          />
          <Text
            style={{
              fontFamily: "ui-rounded",
              fontSize: 34,
              fontWeight: "800",
              color: "black",
            }}
          >
            City pool icon
          </Text>
          <Section>
            <DetailRow
              title="画像を差し替える"
              leading={<SuperAsset name="myCityPoolIcon" size={30} />}
              onPress={() =>
                router.push({
                  pathname: "/settings/street-icons",
                  params: { edit: "1" },
                })
              }
            />
          </Section>
        </View>
      )}
      <View
        style={{
          alignItems: "center",
          marginTop: editing ? -10 : 88,
          gap: editing ? 50 : 30,
        }}
      >
        <View
          style={{ padding: 9, backgroundColor: "white", borderRadius: 40 }}
        >
          <Avatar
            shape="square"
            bucket="street-icons"
            path={
              (editing ? state?.contribution_path : state?.daily_path) ??
              undefined
            }
            version={editing ? undefined : state?.day}
            name=""
            size={editing ? 136 : 128}
          />
          {!editing && (
            <View
              style={{ position: "absolute", top: -22, left: 96, width: 165 }}
            >
              <SpeechBubble>
                <Text style={{ fontSize: 23, fontFamily: "ui-rounded" }}>
                  今日の画像
                </Text>
              </SpeechBubble>
            </View>
          )}
        </View>
        {editing && (
          <NativeAction
            title="画像を変更"
            contentWidth={100}
            tone="neutral"
            disabled={busy}
            onPress={() => void update()}
          />
        )}
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      <View style={{ flex: 1, minHeight: 60 }} />
      <Text
        style={{
          textAlign: "center",
          color: "rgba(0,0,0,0.55)",
          lineHeight: 24,
        }}
      >
        匿名性を守るため、地図上の気配に表示されるアイコンはPoolの中からランダムに選ばれます
      </Text>
      {access.status === "pool_required" && (
        <Action
          title="ログアウト"
          disabled={busy}
          onPress={() =>
            void native
              .logout()
              .catch(() => setError("ログアウトできませんでした。"))
          }
        />
      )}
    </DetailPage>
  );
}
