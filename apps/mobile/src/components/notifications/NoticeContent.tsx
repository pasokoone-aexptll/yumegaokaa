import { Text, View } from "react-native";
import type { Notice } from "../../hooks/useNotifications";
import { Avatar } from "../Avatar";
import { DenshinLogo, SuperAsset } from "../icons/SuperAsset";

export function noticeTitle(n: Notice) {
  switch (n.kind) {
    case "pin_created":
      return "を作成しました";
    case "pin_joined":
      return `${new Date(n.created_at).toLocaleTimeString("ja-JP", { hour: "numeric", minute: "2-digit" })}に参加予定を申請しました`;
    case "pin_closed":
      return n.deleted ? "が削除されました" : "の募集が終了しました";
    case "pin_changed":
      return "が変更されました";
    case "mention":
      return "メンションされました";
    case "canceled":
      return "イベントが中止されました";
    default:
      return "イベントが変更されました";
  }
}

export function NoticeHeading({
  notice,
  large = false,
}: {
  notice: Notice;
  large?: boolean;
}) {
  const pin = ["pin_created", "pin_closed", "pin_changed"].includes(
    notice.kind,
  );
  return (
    <View
      style={{
        flexDirection: large ? "column" : "row",
        alignItems: large ? "flex-start" : "center",
        gap: large ? 8 : 10,
      }}
    >
      {pin ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <DenshinLogo monochrome width={large ? 80 : 60} />
          <Text
            style={{
              fontFamily: "ui-rounded",
              fontSize: large ? 20 : 15,
              color: "rgba(0,0,0,0.7)",
              fontWeight: "600",
            }}
          >
            PIN
          </Text>
        </View>
      ) : notice.kind === "pin_joined" ? (
        <SuperAsset name="非常口から人が出るrounded" width={40} height={58} />
      ) : null}
      <Text
        style={{
          flexShrink: 1,
          fontFamily: "ui-rounded",
          fontSize: large ? 27 : 18,
          fontWeight: "600",
          color: "rgba(0,0,0,0.7)",
        }}
      >
        {noticeTitle(notice)}
      </Text>
    </View>
  );
}

export function NoticeSubject({
  notice,
  detail = false,
}: {
  notice: Notice;
  detail?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        ...(detail
          ? { padding: 14, borderRadius: 26, backgroundColor: "white" }
          : {}),
      }}
    >
      {detail && (
        <Avatar
          shape="square"
          path={notice.avatar_path}
          name={notice.display_name ?? ""}
          size={48}
        />
      )}
      <View style={{ flex: 1, gap: 5 }}>
        {detail && !!notice.display_name && (
          <Text
            style={{
              fontFamily: "ui-rounded",
              color: "rgba(0,0,0,0.35)",
              fontSize: 14,
            }}
          >
            {notice.display_name}
          </Text>
        )}
        <Text
          style={{
            fontSize: detail ? 16 : 14,
            color: detail ? "black" : "rgba(0,0,0,0.5)",
            fontWeight: detail ? "600" : "500",
          }}
        >
          {notice.title}
        </Text>
      </View>
      {!detail && notice.display_name && (
        <Avatar
          shape="square"
          path={notice.avatar_path}
          name={notice.display_name}
          size={30}
        />
      )}
    </View>
  );
}

export function NoticeListContent({ notice }: { notice: Notice }) {
  const joined = notice.kind === "pin_joined";
  if (!joined)
    return (
      <View style={{ gap: 12 }}>
        <NoticeHeading notice={notice} />
        <NoticeSubject notice={notice} />
      </View>
    );
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 11,
        paddingHorizontal: 2,
        alignItems: "flex-start",
      }}
    >
      <SuperAsset name="非常口から人が出るrounded" width={53} height={62} />
      <View style={{ flex: 1, gap: 7 }}>
        <Text
          style={{
            fontFamily: "ui-rounded",
            fontSize: 18,
            lineHeight: 23,
            fontWeight: "600",
            color: "rgba(0,0,0,0.7)",
          }}
        >
          {noticeTitle(notice)}
        </Text>
        <NoticeSubject notice={notice} />
      </View>
    </View>
  );
}
