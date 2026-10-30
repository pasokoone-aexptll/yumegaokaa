import { updateDraft } from "../../lib/pinDraft";
import { usePinCreation } from "../../hooks/usePinCreation";
import { Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Action, Page, ui } from "../../components/Page";
export default function CreatePin() {
  const {
    draft,
    busy,
    error,
    recruitBody,
    publish,
    revise,
    locate,
    locked,
    restoring,
  } = usePinCreation();
  const { kind, title, description, starts, ends, location, capacity } = draft;
  return (
    <Page title="ピンを追加します">
      {restoring && <Text>読み込み中…</Text>}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Action
          title="募集ピンを作る"
          disabled={busy || locked}
          onPress={() => updateDraft({ kind: "recruitment" })}
        />
        <Action
          title="オフ会通知"
          disabled={busy || locked}
          onPress={() => updateDraft({ kind: "event" })}
        />
      </View>
      <TextInput
        editable={!busy && !locked}
        style={ui.input}
        placeholder={kind === "event" ? "オフ会名を入力" : "募集ピン名を入力"}
        maxLength={50}
        value={title}
        onChangeText={(title) => updateDraft({ title })}
      />
      {kind === "event" ? (
        <>
          <Text style={ui.muted}>
            日時の入力例：2026-11-01T18:00（端末の現地時間）
          </Text>
          <TextInput
            editable={!busy && !locked}
            style={ui.input}
            placeholder="開始日時"
            value={starts}
            onChangeText={(starts) => updateDraft({ starts })}
          />
          <TextInput
            editable={!busy && !locked}
            style={ui.input}
            placeholder="終了日時"
            value={ends}
            onChangeText={(ends) => updateDraft({ ends })}
          />
          <TextInput
            editable={!busy && !locked}
            style={ui.input}
            placeholder="定員（1〜100）"
            keyboardType="number-pad"
            value={capacity}
            onChangeText={(capacity) => updateDraft({ capacity })}
          />
          <TextInput
            editable={!busy && !locked}
            style={ui.input}
            multiline
            value={description}
            onChangeText={(description) => updateDraft({ description })}
            placeholder="説明を追加"
            maxLength={1000}
          />
          {location && (
            <Text>
              選択した場所: {location[1].toFixed(5)}, {location[0].toFixed(5)}
            </Text>
          )}
          <Action
            title="場所を選択"
            disabled={busy || locked}
            onPress={() => router.push("/pins/location")}
          />
        </>
      ) : (
        <View style={{ gap: 12 }}>
          <Text style={ui.muted}>
            現在地を公開します。募集は20分または退出で終了します。
          </Text>
          <Action
            title="公開する現在地を確認"
            disabled={busy}
            onPress={() => void locate()}
          />
          {recruitBody && (
            <Text>
              この位置を公開：{Number(recruitBody.latitude).toFixed(5)},{" "}
              {Number(recruitBody.longitude).toFixed(5)}
              題名：{String(recruitBody.title)}
            </Text>
          )}
        </View>
      )}
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Action
        title={busy ? "作成中…" : "ピンを作成"}
        disabled={busy || !title.trim()}
        onPress={() => void publish()}
      />
      <Action
        title="前回の送信を確認して入力し直す"
        disabled={busy}
        onPress={() => void revise()}
      />
      <Action title="閉じる" onPress={() => router.back()} />
    </Page>
  );
}
