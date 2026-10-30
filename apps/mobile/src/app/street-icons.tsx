import { useCallback, useContext, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Alert, Text, View } from "react-native";
import { Action, Page, ui } from "../components/Page";
import { Avatar } from "../components/Avatar";
import { AccountAccessContext } from "../hooks/useAccountAccess";
import {
  chooseStreetIcon,
  imageErrorMessage,
  StreetIconState,
} from "../lib/avatar";
import { native, streetID } from "../lib/native";

export default function StreetIcons() {
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
  return (
    <Page title="街のアイコン">
      <Text>街で使うアイコンをひとつ</Text>
      <Text style={ui.muted}>
        この画像は街のみんなで使います。あなたの地図アイコンも、集まった画像から毎日午前0時にランダムに選ばれます。チャットの本人アイコンとは別です。
      </Text>
      <View style={ui.card}>
        {state?.contribution_path && (
          <Avatar
            bucket="street-icons"
            path={state.contribution_path}
            name=""
            size={88}
          />
        )}
        <Action
          title={
            state?.contribution_path
              ? "提供画像を差し替える"
              : "画像を選んで街に提供"
          }
          disabled={busy}
          onPress={() => void update()}
        />
        {state?.contribution_id && (
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
      </View>
      {state?.daily_path && (
        <View style={ui.card}>
          <Text>今日のあなたのアイコン</Text>
          <Avatar
            bucket="street-icons"
            path={state.daily_path}
            version={state.day}
            name=""
            size={88}
          />
        </View>
      )}
      {!!error && <Text style={ui.error}>{error}</Text>}
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
    </Page>
  );
}
