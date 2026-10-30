import { useCallback, useState } from "react";
import { Text, TextInput } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Action, Empty, Page, ui } from "../../components/Page";
import { native } from "../../lib/native";
import { Recruitment } from "../../lib/recruitments";
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pin, setPin] = useState<Recruitment>(),
    [title, setTitle] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const p = await native.rpc<Recruitment>("recruitment_get", { id });
      setPin(p);
      setTitle(p.title);
      setError("");
    } catch {
      setPin(undefined);
      setError("募集は終了したか、取得できませんでした。");
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  async function act(op: string) {
    setBusy(true);
    try {
      await native.rpc(op, { id, title, revision: pin?.revision });
      if (op === "recruitment_end") router.replace("/");
      else await load();
    } catch {
      setError("変更できませんでした。最新情報を確認してください。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={pin?.title ?? "募集"}>
      {!!error && <Text style={ui.error}>{error}</Text>}
      {pin ? (
        <>
          <Text>{pin.display_name} が募集中</Text>
          <Text>{new Date(pin.expires_at).toLocaleTimeString()}まで</Text>
          <Action
            title="通報"
            onPress={() =>
              router.push({
                pathname: "/report",
                params: { kind: "recruitment", id },
              })
            }
          />
          <Action
            title="Mapで場所を見る"
            onPress={() =>
              router.navigate({
                pathname: "/",
                params: { longitude: pin.longitude, latitude: pin.latitude },
              })
            }
          />
          {pin.mine && (
            <>
              <TextInput
                style={ui.input}
                value={title}
                maxLength={50}
                onChangeText={setTitle}
              />
              <Action
                title="題名を保存"
                disabled={busy}
                onPress={() => void act("recruitment_edit")}
              />
              <Action
                title="募集を終了"
                disabled={busy}
                onPress={() => void act("recruitment_end")}
              />
            </>
          )}
        </>
      ) : (
        <Empty>終了した募集の位置は表示しません。</Empty>
      )}
      <Action title="再読み込み" onPress={() => void load()} />
    </Page>
  );
}
