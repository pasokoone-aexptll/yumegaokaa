import { RecruitmentIcon } from "../../components/RecruitmentIcon";
import { openMapAt } from "../../lib/mapNavigation";
import { Alert, Text, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  DetailPage,
  DetailRow,
  Section,
  PrimaryAction,
  detail,
} from "../../components/DetailUI";
import { useRecruitmentDetail } from "../../hooks/useRecruitmentDetail";
export default function Detail() {
  const { id, fromMap } = useLocalSearchParams<{
    id: string;
    fromMap?: string;
  }>();
  const { pin, title, editTitle, error, busy, loading, ended, load, act } =
    useRecruitmentDetail(id);
  return (
    <DetailPage
      mapSheet={fromMap === "1"}
      title={pin?.title ?? "募集"}
      refreshing={busy || loading}
      onRefresh={ended ? undefined : () => load()}
    >
      {!!error && (
        <Text accessibilityRole="alert" style={detail.error}>
          {error}
        </Text>
      )}
      {pin ? (
        <>
          <Section>
            <DetailRow
              leading={<RecruitmentIcon pin={pin} />}
              title={`${pin.display_name} が募集中`}
            />
            <DetailRow
              icon="time-outline"
              title={`${new Date(pin.expires_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}まで`}
            />
          </Section>
          {fromMap !== "1" && (
            <PrimaryAction
              title="地図で場所を見る"
              onPress={() =>
                openMapAt(pin.longitude, pin.latitude, {
                  kind: "recruitment",
                  id,
                })
              }
            />
          )}
          {pin.mine && (
            <>
              <Section title="募集の題名">
                <TextInput
                  accessibilityLabel="募集の題名"
                  style={detail.input}
                  value={title}
                  maxLength={50}
                  onChangeText={editTitle}
                  editable={!busy}
                />
                <DetailRow
                  icon="reload"
                  title="最新の題名に戻す"
                  disabled={busy}
                  onPress={() =>
                    Alert.alert(
                      "入力を最新の題名に置き換えますか？",
                      undefined,
                      [
                        { text: "戻る", style: "cancel" },
                        { text: "置き換える", onPress: () => void load(true) },
                      ],
                    )
                  }
                />
              </Section>
              <PrimaryAction
                title="変更を保存"
                disabled={busy || !title.trim() || title === pin.title}
                onPress={() => act("recruitment_edit")}
              />
              <Section>
                <DetailRow
                  title="募集を終了"
                  icon="close-circle-outline"
                  danger
                  disabled={busy}
                  onPress={() =>
                    Alert.alert("募集を終了しますか？", undefined, [
                      { text: "戻る", style: "cancel" },
                      {
                        text: "終了する",
                        style: "destructive",
                        onPress: () => void act("recruitment_end"),
                      },
                    ])
                  }
                />
              </Section>
            </>
          )}
          <Section>
            <DetailRow
              icon="flag-outline"
              title="この募集を通報"
              onPress={() =>
                router.push({
                  pathname: "/report",
                  params: { kind: "recruitment", id },
                })
              }
            />
          </Section>
        </>
      ) : (
        <Text style={detail.secondary}>
          {ended
            ? "募集は終了しました"
            : loading
              ? "読み込み中…"
              : "募集を表示できません"}
        </Text>
      )}
    </DetailPage>
  );
}
