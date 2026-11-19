import { useCallback, useContext, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Text, View } from "react-native";
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
  async function update(remove = false) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = remove
        ? await native.rpc<StreetIconState>("street_icon_remove", {
            street_id: streetID,
            id: state?.contribution_id,
          })
        : await chooseStreetIcon();
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
    <DetailPage title={editing ? "画像を差し替える" : "City pool icon"}>
      {!editing && (
        <>
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <SpeechBubble>
              <Text style={{ color: "rgba(0,140,255,0.7)", fontSize: 21 }}>
                街の気配
              </Text>
            </SpeechBubble>
            <SuperAsset name="myCityPoolIcon" size={74} />
          </View>
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
        </>
      )}
      <View
        style={{ alignItems: "center", marginTop: editing ? 30 : 65, gap: 30 }}
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
            size={140}
          />
        </View>
        {!editing && (
          <SpeechBubble>
            <Text style={{ fontSize: 23, fontFamily: "ui-rounded" }}>
              今日の画像
            </Text>
          </SpeechBubble>
        )}
        {editing && (
          <NativeAction
            title="画像を変更"
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
      <View style={{ flex: 1, minHeight: 80 }} />
      <Text
        style={{
          textAlign: "center",
          color: "rgba(0,0,0,0.55)",
          lineHeight: 24,
        }}
      >
        匿名性を守るため、地図上の気配に表示されるアイコンはPoolの中からランダムに選ばれます
      </Text>
      {editing && state?.contribution_id && (
        <Action
          title="提供を取り下げる"
          disabled={busy}
          onPress={() =>
            Alert.alert(
              "画像を取り下げますか？",
              "この画像は街のpoolで使われなくなります。",
              [
                { text: "キャンセル", style: "cancel" },
                {
                  text: "取り下げる",
                  style: "destructive",
                  onPress: () => void update(true),
                },
              ],
            )
          }
        />
      )}
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
