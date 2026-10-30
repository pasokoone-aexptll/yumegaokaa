import { Alert, Text, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Action, Empty, Page, ui } from "../../components/Page";
import { useRecruitmentDetail } from "../../hooks/useRecruitmentDetail";
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pin, title, editTitle, error, busy, loading, ended, load, act } =
    useRecruitmentDetail(id);
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
                onChangeText={editTitle}
                editable={!busy}
                accessibilityLabel="募集の題名"
              />
              <Action
                title="題名を保存"
                disabled={busy || !title.trim()}
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
        <Empty>
          {ended
            ? "募集は終了しました"
            : loading
              ? "読み込み中…"
              : "募集を表示できません"}
        </Empty>
      )}
      {!ended && (
        <Action
          title="再読み込み"
          disabled={busy}
          onPress={() => void load()}
        />
      )}
      {pin?.mine && (
        <Action
          title="最新の題名を読み込む"
          disabled={busy}
          onPress={() =>
            Alert.alert("入力を最新の題名に置き換えますか？", undefined, [
              { text: "戻る", style: "cancel" },
              { text: "置き換える", onPress: () => void load(true) },
            ])
          }
        />
      )}
    </Page>
  );
}
