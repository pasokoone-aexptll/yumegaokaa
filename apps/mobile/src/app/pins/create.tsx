import { useState } from "react";
import { usePinDraft, updateDraft, clearDraft } from "../../lib/pinDraft";
import {
  submitCommand,
  pendingCommand,
  cancelPendingCommand,
} from "../../lib/commands";
import { native, streetID } from "../../lib/native";
import { Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Action, Page, ui } from "../../components/Page";
export default function CreatePin() {
  const draft = usePinDraft();
  const { kind, title, description, starts, ends, location, capacity } = draft;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [recruitBody, setRecruitBody] = useState<Record<string, unknown>>();
  async function revise() {
    setBusy(true);
    setError("");
    try {
      const result = await cancelPendingCommand<{ id: string }>(
        kind === "event" ? "event_create" : "recruitment_create",
      );
      if (result) {
        router.replace({
          pathname: kind === "event" ? "/events/[id]" : "/recruitments/[id]",
          params: { id: result.id },
        });
        return;
      }
      setRecruitBody(undefined);
      setError(
        "未確定の送信を取り消しました。内容を修正し、募集の場合は現在地を取り直してください。",
      );
    } catch {
      setError(
        "前回の送信が未確認です。通信復旧後にもう一度確認してください。",
      );
    } finally {
      setBusy(false);
    }
  }
  async function locate() {
    setBusy(true);
    try {
      const existing = await pendingCommand("recruitment_create");
      if (existing) {
        setRecruitBody(existing.body);
        setError("前回の送信結果を同じ内容で確認します。");
        return;
      }
      const p = await native.currentLocation();
      const v = await native.rpc<{
        visit: { visit_id: string; can_update: boolean } | null;
      }>("get_my_visit", {});
      if (!v.visit?.can_update || p.accuracy > 50)
        throw Error("location_or_visit");
      setRecruitBody({
        visit_id: v.visit.visit_id,
        title: title.trim(),
        longitude: p.longitude,
        latitude: p.latitude,
        accuracy: p.accuracy,
        observed_at: new Date(p.observed_at).toISOString(),
      });
      setError("");
    } catch {
      setError("この端末で入街し、精度のよい現在地を取得してください。");
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    setError("");
    if (kind !== "event") {
      if (!recruitBody) {
        setError("先に公開する現在地を確認してください。");
        return;
      }
      setBusy(true);
      try {
        const r = await submitCommand<{ id: string }>(
          "recruitment_create",
          recruitBody,
        );
        clearDraft();
        router.replace({
          pathname: "/recruitments/[id]",
          params: { id: r.id },
        });
      } catch {
        setError(
          "募集を作成できませんでした。前回の結果を確認してから再試行してください。",
        );
      } finally {
        setBusy(false);
      }
      return;
    }
    const start = new Date(starts),
      end = new Date(ends);
    if (
      !location ||
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime())
    ) {
      setError("場所と開始・終了日時を確認してください。");
      return;
    }
    setBusy(true);
    try {
      const r = await submitCommand<{ id: string }>("event_create", {
        street_id: streetID,
        title: title.trim(),
        description,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        longitude: location[0],
        latitude: location[1],
        capacity: Number(capacity),
      });
      clearDraft();
      router.replace({ pathname: "/events/[id]", params: { id: r.id } });
    } catch {
      setError(
        "作成できませんでした。入力・街の範囲・接続を確認してください。通信が不明な場合は同じ内容で再試行します。",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title="ピンを追加します">
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Action
          title="募集ピンを作る"
          disabled={busy}
          onPress={() => updateDraft({ kind: "recruitment" })}
        />
        <Action
          title="オフ会通知"
          disabled={busy}
          onPress={() => updateDraft({ kind: "event" })}
        />
      </View>
      <TextInput
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
            style={ui.input}
            placeholder="開始日時"
            value={starts}
            onChangeText={(starts) => updateDraft({ starts })}
          />
          <TextInput
            style={ui.input}
            placeholder="終了日時"
            value={ends}
            onChangeText={(ends) => updateDraft({ ends })}
          />
          <TextInput
            style={ui.input}
            placeholder="定員（1〜100）"
            keyboardType="number-pad"
            value={capacity}
            onChangeText={(capacity) => updateDraft({ capacity })}
          />
          <TextInput
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
