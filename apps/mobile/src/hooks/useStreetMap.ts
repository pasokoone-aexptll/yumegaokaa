import { localBlocks } from "../lib/localBlocks";
import { streetChanges } from "../lib/streetChanges";
import "react-native-url-polyfill/auto";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Platform } from "react-native";
import { closeMenu, setToolsButtonVisible } from "expo-dev-client";
import { gatewayConnection } from "../lib/gatewayConnection";
import NfcManager, { NfcTech, Ndef } from "react-native-nfc-manager";
import {
  key,
  displayClock,
  native,
  NativeState,
  Snapshot,
  streetID,
  url,
} from "../lib/native";
import { Recruitment } from "../lib/recruitments";
import { StreetEvent } from "../lib/events";
import { scanPrompt } from "../lib/entryPlatform";
import { fieldTrial, localEntry, localHost, nfcDisabled } from "../lib/development";
const initial: NativeState = {
  observing: false,
  status: "未参加",
  pending_exit: false,
  visit: {},
};
const friendly = (error: unknown) => {
  const s = String(error);
  if (s.includes("otp_expired"))
    return "確認コードが無効か期限切れです。新しいコードを送信してください。";
  if (s.includes("credential_storage_failed"))
    return "認証情報を端末に保存できませんでした。アプリを開き直してお試しください。";
  if (s.includes("membership_required"))
    return "このアカウントはまだ招待登録されていません。開発環境では運営用コマンドで登録してください。";
  if (s.includes("location_permission_required"))
    return "位置情報を許可してから、もう一度入街してください。設定アプリで許可を変更できます。";
  if (/inside_fix_required|stale_observation/.test(s))
    return "街の内側で現在地を確認してから、通常モードに戻してください。";
  if (s.includes("operation_in_progress"))
    return "参加状態を確認中です。少し待ってからお試しください。";
  if (s.includes("nfc_off")) return "端末のNFCをオンにしてから、もう一度読み取ってください。";
  if (/invalid_tag|SyntaxError/.test(s)) return "夢ヶ丘のNFCステッカーを読み取ってください。";
  if (s.includes("inactive_tag")) return "このステッカーは現在使えません。";
  if (s.includes("wrong_writer"))
    return "別の端末で参加しています。この端末で参加するにはNFCにタッチしてください。";
  return "接続または参加状態を確認できませんでした。もう一度お試しください。";
};
export function useStreetMap() {
  const [events, setEvents] = useState<StreetEvent[]>([]);
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [ready, setReady] = useState(!url || !key),
    [signed, setSigned] = useState(false),
    [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false);
  const [state, setState] = useState(initial),
    [snapshot, setSnapshot] = useState<Snapshot>(),
    [now, setNow] = useState(0),
    [name, setName] = useState("夢ヶ丘");
  const [refreshError, setRefreshError] = useState("");
  const [error, setError] = useState(
      !url || !key
        ? "開発接続設定がありません。npm run setup:local を実行してください。"
        : "",
    ),
    [busy, setBusy] = useState(false),
    [sheet, setSheet] = useState<
      "explain" | "scanning" | "checking" | "success" | null
    >(null),
    [settings, setSettings] = useState(false);
  const [entryError, setEntryError] = useState("");
  useEffect(() => { if (!sheet) setEntryError(""); }, [sheet]);
  const entryInFlight = useRef(false);
  const canceled = useRef(false),
    fetching = useRef(false),
    refreshQueued = useRef(false),
    clock = useRef({ server: 0, local: 0 }),
    snapshotGeneration = useRef(0);
  const invalidateSnapshot = useCallback(() => {
    snapshotGeneration.current++;
    refreshQueued.current = false;
  }, []);
  const refresh = useCallback(async (): Promise<void> => {
    if (fetching.current) {
      refreshQueued.current = true;
      return;
    }
    refreshQueued.current = false;
    fetching.current = true;
    const generation = snapshotGeneration.current;
    try {
      const synced = await displayClock();
      const s = await native.rpc<Snapshot>("get_presence_snapshot", {
        street_id: streetID,
      });
      if (generation !== snapshotGeneration.current) return;
      clock.current = synced;
      setNow(synced.server + native.monotonicTime() - synced.local);
      setSnapshot(s);
      const config = await native.rpc<{ name: string }>("get_street_config", {
        street_id: streetID,
      });
      if (generation !== snapshotGeneration.current) return;
      setName(config.name);
      const pins = await native.rpc<{ items: StreetEvent[] }>("event_list", {
        street_id: streetID,
      });
      if (generation !== snapshotGeneration.current) return;
      setEvents(pins.items);
      const recruiting = await native.rpc<{ items: Recruitment[] }>(
        "recruitment_list",
        { street_id: streetID },
      );
      if (generation !== snapshotGeneration.current) return;
      setRecruitments(
        recruiting.items.filter((p) => !localBlocks.hidden(p.author_id)),
      );
      setRefreshError("");
    } catch (e) {
      if (generation !== snapshotGeneration.current) return;
      setRefreshError(friendly(e));
      if (
        ["membership_required", "unauthorized", "login_required"].some((x) =>
          String(e).includes(x),
        )
      )
        setSnapshot(undefined);
    } finally {
      fetching.current = false;
      if (refreshQueued.current && generation === snapshotGeneration.current) {
        refreshQueued.current = false;
        void refresh();
      }
    }
  }, []);
  useEffect(() => {
    if (__DEV__) {
      setToolsButtonVisible(false);
      closeMenu();
    }
    if (!url || !key) return;
    native
      .configure(url, key)
      .then(() => native.session())
      .then((s) => {
        setSigned(s.signed_in);
        setEmail(s.email);
        setReady(true);
      })
      .catch((e) => {
        setError(friendly(e));
        setReady(true);
      });
    const listener = native.addListener("onChange", (s) => setState(s));
    return () => listener.remove();
  }, []);
  useEffect(() => {
    if (!signed) return;
    native
      .resume()
      .then((s) => {
        setState(s);
        void refresh();
      })
      .catch((e) => setError(friendly(e)));
    const gateway = gatewayConnection({
      token: () => native.realtimeToken(),
      connect: (token) => {
        let endpoint = process.env.EXPO_PUBLIC_GATEWAY_URL;
        if (!endpoint && localHost) {
          const local = new URL(url);
          local.protocol = local.protocol === "https:" ? "wss:" : "ws:";
          local.port = "54325";
          local.pathname = "/street";
          local.search = "";
          endpoint = local.toString();
        }
        if (!endpoint || (!localHost && !endpoint.startsWith("wss://")))
          throw new Error("gateway_not_configured");
        // React Native supports handshake headers; DOM typings omit this option.
        const NativeWebSocket = WebSocket as unknown as {
          new (
            url: string,
            protocols: undefined,
            options: { headers: Record<string, string> },
          ): WebSocket;
        };
        return new NativeWebSocket(endpoint, undefined, {
          headers: { Authorization: `Bearer ${token}` },
        });
      },
      reconnected: () => {
        if (Platform.OS === "android") void native.resume().then(setState).catch(() => {});
      },
      changed: () => {
        streetChanges.notify();
        void refresh();
      },
    });
    gateway.setActive(AppState.currentState === "active");
    const unsubscribeBlocks = localBlocks.subscribe(() => {
      setRecruitments((items) =>
        items.filter((p) => !localBlocks.hidden(p.author_id)),
      );
      void refresh();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void refresh();
    }, 10000);
    const ticker = setInterval(
      () =>
        setNow(
          clock.current.server + native.monotonicTime() - clock.current.local,
        ),
      1000,
    );
    const sub = AppState.addEventListener("change", (s) => {
      gateway.setActive(s === "active");
      if (s === "active") {
        void refresh();
        native
          .resume()
          .then(setState)
          .catch(() => {});
      }
    });
    return () => {
      unsubscribeBlocks();
      invalidateSnapshot();
      clearInterval(timer);
      clearInterval(ticker);
      sub.remove();
      gateway.setActive(false);
    };
  }, [signed, refresh, invalidateSnapshot]);
  const authInFlight = useRef(false);
  const [nextSendAt, setNextSendAt] = useState(0);
  async function login(resend = false) {
    if (authInFlight.current) return;
    const sending = resend || !sent;
    if (sending && Date.now() < nextSendAt) {
      setSent(true);
      setError("再送まで少しお待ちください。届いているコードは入力できます。");
      return;
    }
    authInFlight.current = true;
    setBusy(true);
    setError("");
    try {
      if (sending) {
        await native.sendOTP(email.trim());
        setNextSendAt(Date.now() + 60000);
        setCode("");
        setSent(true);
      } else {
        await native.verifyOTP(email.trim(), code.trim());
        setSigned(true);
      }
    } catch (e) {
      const message = String(e);
      if (sending && /over_email_send_rate_limit|over_request_rate_limit|rate limit|after .*seconds/i.test(message)) {
        setSent(true);
        setNextSendAt(Date.now() + 60000);
        setError("メールの送信上限に達しました。届いている最新のコードを入力するか、時間をおいて再送してください。");
      } else {
        setError(friendly(e));
      }
    } finally {
      authInFlight.current = false;
      setBusy(false);
    }
  }
  async function exit() {
    canceled.current = true;
    setSheet(null);
    setState((previous) => ({
      ...previous,
      observing: false,
      pending_exit: true,
      status: "退出を反映中",
    }));
    void NfcManager.cancelTechnologyRequest().catch(() => {});
    try {
      setState(await native.stop());
      await refresh();
    } catch {
      setError("端末の観測は停止しました。退出は通信回復後に反映します。");
    }
  }
  async function enterFixture(tagId: string) {
    canceled.current = false;
    setSheet("checking");
    setError("");
    try {
      const result = await native.checkin(tagId);
      if (!canceled.current) {
        setState(result);
        setSheet("success");
        await refresh();
      }
    } catch (e) {
      if (!canceled.current) {
        setEntryError(fieldTrial && tagId === "14fdc906-3ff4-4576-a212-35c42642dd49" && String(e).includes("inactive_tag")
          ? "このアカウントには有効な現地試験の入街許可がありません。登録済みのNFCステッカーで入街してください。"
          : friendly(e));
        setSheet("explain");
      }
    }
  }
  async function scan(source: "default" | "tag" = "default") {
    if (entryInFlight.current) {
      setError(friendly("operation_in_progress"));
      return;
    }
    setEntryError("");
    entryInFlight.current = true;
    try {
      await performScan(source);
    } finally {
      entryInFlight.current = false;
    }
  }
  async function performScan(source: "default" | "tag") {
    if (fieldTrial && source === "default") {
      await enterFixture("14fdc906-3ff4-4576-a212-35c42642dd49");
      return;
    }
    if (nfcDisabled && !localEntry) {
      setError(
        "NFC代替はローカルAPIに接続した開発・検証用ビルドで使用してください。",
      );
      setSheet(null);
      return;
    }
    if (localEntry) {
      await enterFixture("22222222-2222-4222-8222-222222222222");
      return;
    }
    canceled.current = false;
    setSheet("scanning");
    setError("");
    try {
      await NfcManager.start();
      if (!await NfcManager.isEnabled()) throw new Error("nfc_off");
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: scanPrompt,
      });
      const tag = await NfcManager.getTag();
      const record = tag?.ndefMessage?.find((r) =>
        Ndef.isType(r, Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT),
      );
      if (!record) throw new Error("invalid_tag");
      const text = Ndef.text.decodePayload(Uint8Array.from(record.payload));
      const payload = JSON.parse(text);
      if (
        payload.v !== 1 ||
        typeof payload.tag_id !== "string" ||
        !/^[0-9a-f-]{36}$/i.test(payload.tag_id)
      )
        throw new Error("invalid_tag");
      await NfcManager.cancelTechnologyRequest();
      if (canceled.current) return;
      setSheet("checking");
      const s = await native.checkin(payload.tag_id);
      if (!canceled.current) {
        setState(s);
        setSheet("success");
        await refresh();
      }
    } catch (e) {
      if (!canceled.current) {
        setEntryError(friendly(e));
        setSheet("explain");
      }
    } finally {
      await NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  }

  async function writeTestTag() {
    Alert.alert(
      "開発用ステッカーを設定",
      "この操作はステッカーの内容を上書きします。空のテスト用ステッカーだけを使ってください。実際の街への公開登録ではありません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "空のテスト用タグに書き込む",
          onPress: () =>
            void (async () => {
              try {
                await NfcManager.start();
                await NfcManager.requestTechnology(NfcTech.Ndef, {
                  alertMessage: "空のテスト用ステッカーにタッチ",
                });
                const before = await NfcManager.getTag();
                if (before?.ndefMessage?.length)
                  throw new Error("tag_not_empty");
                const text = JSON.stringify({
                  v: 1,
                  tag_id: "22222222-2222-4222-8222-222222222222",
                });
                const bytes = Ndef.encodeMessage([Ndef.textRecord(text)]);
                if (!bytes) throw new Error("invalid_tag");
                await NfcManager.ndefHandler.writeNdefMessage(bytes);
                await NfcManager.cancelTechnologyRequest();
                Alert.alert(
                  "書き込み完了",
                  "次に街のスイッチをONにし、同じタグを読み取ってください。",
                );
              } catch (e) {
                Alert.alert(
                  "書き込めませんでした",
                  String(e).includes("tag_not_empty")
                    ? "データが入っているタグは上書きしません。空のタグを使ってください。"
                    : "NDEF形式で書き込み可能なタグか確認してください。",
                );
              } finally {
                await NfcManager.cancelTechnologyRequest().catch(() => {});
              }
            })(),
        },
      ],
    );
  }
  const active =
    state.visit.state === "active" &&
    state.visit.can_update === true &&
    !state.pending_exit &&
    (!state.visit.expires_at || Date.parse(state.visit.expires_at) > now);
  async function changeMode(ghost: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      setState(await native.setGhost(ghost));
      await refresh();
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    snapshotGeneration.current++;
    refreshQueued.current = false;
    await native.logout();
    setSnapshot(undefined);
    setEvents([]);
    setRecruitments([]);
    setState(initial);
    setSigned(false);
    setSettings(false);
    setSent(false);
    setCode("");
    setEmail("");
  }
  return {
    ready,
    signed,
    email,
    setEmail,
    code,
    setCode,
    sent,
    setSent,
    state,
    snapshot,
    now,
    name,
    error: error || refreshError,
    connectionUnavailable: !!refreshError,
    setError,
    busy,
    sheet,
    entryError,
    setSheet,
    settings,
    setSettings,
    events,
    recruitments,
    login,
    nextSendAt,
    exit,
    scan,
    writeTestTag,
    active,
    logout,
    changeMode,
  };
}
