調査日：2026-11-01。対象コード：`45c089e`（本調査で製品コード変更なし）。
これは**現行実装の観察記録**であり、新しい製品仕様・デザイン案ではない。実装済みはソース上の接続の存在を意味し、全状態の実機成功を意味しない。検証事実の正本は[TECH_VALIDATION](../TECH_VALIDATION.md)、進捗は[MVP_TASKS](../MVP_TASKS.md)。

# 07 ソース照合・追跡索引

Router/component/hook/libの全対象ファイルを列挙。関数と行番号はこのコミット時点。型は表示情報とAPIの契約を追うための引用であり、SQLが返す全列と同一とは限らない。07だけで動作仕様の代わりにしない。

## app

| ソース | 画面対応 | シンボル:行 | 直接のローカル依存 |
| --- | --- | --- | --- |
| [`app/(tabs)/_layout.tsx`](<../../apps/mobile/src/app/(tabs)/_layout.tsx>) | 共有処理/レイアウト（04参照） | StreetTabs:3 | ../../components/TabIcon |
| [`app/(tabs)/home.tsx`](<../../apps/mobile/src/app/(tabs)/home.tsx>) | [S002](02_SCREEN_SPECIFICATIONS.md#s002) | Home:7 | ../../components/PinListItem, ../../components/Page, ../../hooks/useHomePins |
| [`app/(tabs)/index.tsx`](<../../apps/mobile/src/app/(tabs)/index.tsx>) | [S001](02_SCREEN_SPECIFICATIONS.md#s001) [S030](02_SCREEN_SPECIFICATIONS.md#s030) | Street:25, closeAccount:62, recenter:79 | ../../components/PresenceHeader, ../../components/StreetLogin, ../../components/StreetEntrySheet, ../../components/StreetMapMarkers, ../../components/streetMapStyles, ../../lib/mapStyle, ../../components/StreetChat, ../../lib/native, ../../lib/presence, ../../lib/development, ../../hooks/useStreetMap |
| [`app/(tabs)/settings.tsx`](<../../apps/mobile/src/app/(tabs)/settings.tsx>) | [S003](02_SCREEN_SPECIFICATIONS.md#s003) | Settings:3 | ../../components/Page |
| [`app/_layout.tsx`](<../../apps/mobile/src/app/_layout.tsx>) | 共有処理/レイアウト（04参照） | Layout:10 | ../hooks/usePushNotifications, ../hooks/useAccountAccess, ../lib/sessionState |
| [`app/access.tsx`](<../../apps/mobile/src/app/access.tsx>) | [S017](02_SCREEN_SPECIFICATIONS.md#s017) | Access:6 | ../components/Page, ../hooks/useAccountAccess, ../lib/native |
| [`app/account.tsx`](<../../apps/mobile/src/app/account.tsx>) | [S009](02_SCREEN_SPECIFICATIONS.md#s009) [S033](02_SCREEN_SPECIFICATIONS.md#s033) | Account:5 | ../components/Page, ../hooks/useEmailChange |
| [`app/admin.tsx`](<../../apps/mobile/src/app/admin.tsx>) | [S014](02_SCREEN_SPECIFICATIONS.md#s014) [S038](02_SCREEN_SPECIFICATIONS.md#s038) [S039](02_SCREEN_SPECIFICATIONS.md#s039) | Screen:5 | ../components/Page, ../hooks/useOperatorDashboard |
| [`app/blocks.tsx`](<../../apps/mobile/src/app/blocks.tsx>) | [S008](02_SCREEN_SPECIFICATIONS.md#s008) | Blocks:8, unblock:30 | ../lib/localBlocks, ../components/Page, ../lib/native |
| [`app/events/[id].tsx`](<../../apps/mobile/src/app/events/[id].tsx>) | [S011](02_SCREEN_SPECIFICATIONS.md#s011) [S035](02_SCREEN_SPECIFICATIONS.md#s035) [D003](02_SCREEN_SPECIFICATIONS.md#d003) | Event:6 | ../../lib/mapNavigation, ../../components/Page, ../../hooks/useEventDetail |
| [`app/events/edit/[id].tsx`](<../../apps/mobile/src/app/events/edit/[id].tsx>) | [S012](02_SCREEN_SPECIFICATIONS.md#s012) [S036](02_SCREEN_SPECIFICATIONS.md#s036) [D004](02_SCREEN_SPECIFICATIONS.md#d004) | Edit:8 | ../../../components/EventDateField, ../../../components/Page, ../../../components/LocationPicker, ../../../hooks/useEventEditor |
| [`app/invitations.tsx`](<../../apps/mobile/src/app/invitations.tsx>) | [S006](02_SCREEN_SPECIFICATIONS.md#s006) [S031](02_SCREEN_SPECIFICATIONS.md#s031) [S032](02_SCREEN_SPECIFICATIONS.md#s032) [S045](02_SCREEN_SPECIFICATIONS.md#s045) | Invitations:5 | ../components/Page, ../lib/native, ../hooks/useInvitations |
| [`app/members.tsx`](<../../apps/mobile/src/app/members.tsx>) | [S015](02_SCREEN_SPECIFICATIONS.md#s015) | Members:7 | ../components/Page, ../components/MemberRow, ../hooks/useMembers |
| [`app/moderation.tsx`](<../../apps/mobile/src/app/moderation.tsx>) | [S016](02_SCREEN_SPECIFICATIONS.md#s016) [D007](02_SCREEN_SPECIFICATIONS.md#d007) | Moderation:6 | ../components/Page, ../hooks/useModeration |
| [`app/notifications.tsx`](<../../apps/mobile/src/app/notifications.tsx>) | [S007](02_SCREEN_SPECIFICATIONS.md#s007) | Notifications:6 | ../hooks/usePushNotifications, ../components/Page, ../hooks/useNotifications |
| [`app/pins/create.tsx`](<../../apps/mobile/src/app/pins/create.tsx>) | [S018](02_SCREEN_SPECIFICATIONS.md#s018) [S041](02_SCREEN_SPECIFICATIONS.md#s041) [S042](02_SCREEN_SPECIFICATIONS.md#s042) [S043](02_SCREEN_SPECIFICATIONS.md#s043) | CreatePin:7 | ../../components/EventDateField, ../../lib/pinDraft, ../../hooks/usePinCreation, ../../components/Page |
| [`app/pins/location.tsx`](<../../apps/mobile/src/app/pins/location.tsx>) | [S023](02_SCREEN_SPECIFICATIONS.md#s023) | Location:4 | ../../components/LocationPicker, ../../lib/pinDraft |
| [`app/profile.tsx`](<../../apps/mobile/src/app/profile.tsx>) | [S004](02_SCREEN_SPECIFICATIONS.md#s004) | Profile:8 | ../lib/native, ../hooks/useAccountAccess, ../components/Page, ../components/Avatar, ../hooks/useProfile |
| [`app/recruitments/[id].tsx`](<../../apps/mobile/src/app/recruitments/[id].tsx>) | [S013](02_SCREEN_SPECIFICATIONS.md#s013) [D005](02_SCREEN_SPECIFICATIONS.md#d005) | Detail:6 | ../../lib/mapNavigation, ../../components/Page, ../../hooks/useRecruitmentDetail |
| [`app/report.tsx`](<../../apps/mobile/src/app/report.tsx>) | [S019](02_SCREEN_SPECIFICATIONS.md#s019) [S047](02_SCREEN_SPECIFICATIONS.md#s047) | Report:6, send:13 | ../components/Page, ../lib/native |
| [`app/stickers/[id].tsx`](<../../apps/mobile/src/app/stickers/[id].tsx>) | [S021](02_SCREEN_SPECIFICATIONS.md#s021) [S050](02_SCREEN_SPECIFICATIONS.md#s050) [S051](02_SCREEN_SPECIFICATIONS.md#s051) [S052](02_SCREEN_SPECIFICATIONS.md#s052) [S053](02_SCREEN_SPECIFICATIONS.md#s053) [S054](02_SCREEN_SPECIFICATIONS.md#s054) [S062](02_SCREEN_SPECIFICATIONS.md#s062) [S063](02_SCREEN_SPECIFICATIONS.md#s063) [D008](02_SCREEN_SPECIFICATIONS.md#d008) [D009](02_SCREEN_SPECIFICATIONS.md#d009) | Sticker:7 | ../../components/LocationPicker, ../../components/Page, ../../lib/stickers, ../../hooks/useStickerDetail |
| [`app/stickers/area.tsx`](<../../apps/mobile/src/app/stickers/area.tsx>) | [S022](02_SCREEN_SPECIFICATIONS.md#s022) [S055](02_SCREEN_SPECIFICATIONS.md#s055) [D010](02_SCREEN_SPECIFICATIONS.md#d010) [D011](02_SCREEN_SPECIFICATIONS.md#d011) [D012](02_SCREEN_SPECIFICATIONS.md#d012) [D013](02_SCREEN_SPECIFICATIONS.md#d013) | Area:31, run:61, move:72, replaceSticker:87 | ../../components/Page, ../../components/LocationPicker, ../../lib/native, ../../lib/mapStyle, ../../lib/commands, ../../lib/stickers |
| [`app/stickers/index.tsx`](<../../apps/mobile/src/app/stickers/index.tsx>) | [S020](02_SCREEN_SPECIFICATIONS.md#s020) [S048](02_SCREEN_SPECIFICATIONS.md#s048) [S049](02_SCREEN_SPECIFICATIONS.md#s049) | Stickers:6 | ../../components/Page, ../../components/LocationPicker, ../../hooks/useStickerRegistration |
| [`app/street-icons.tsx`](<../../apps/mobile/src/app/street-icons.tsx>) | [S005](02_SCREEN_SPECIFICATIONS.md#s005) [D001](02_SCREEN_SPECIFICATIONS.md#d001) | StreetIcons:14, update:42 | ../components/Page, ../components/Avatar, ../hooks/useAccountAccess, ../lib/avatar, ../lib/native |
| [`app/withdraw.tsx`](<../../apps/mobile/src/app/withdraw.tsx>) | [S010](02_SCREEN_SPECIFICATIONS.md#s010) [S034](02_SCREEN_SPECIFICATIONS.md#s034) [D002](02_SCREEN_SPECIFICATIONS.md#d002) | Withdraw:4 | ../components/Page, ../hooks/useWithdrawal |

## components

| ソース | 画面対応 | シンボル:行 | 直接のローカル依存 |
| --- | --- | --- | --- |
| [`components/Avatar.tsx`](<../../apps/mobile/src/components/Avatar.tsx>) | 共有処理/レイアウト（04参照） | Avatar:5, retry:46 | ../lib/native |
| [`components/EventCloudPin.tsx`](<../../apps/mobile/src/components/EventCloudPin.tsx>) | 共有処理/レイアウト（04参照） | EventCloudPin:14 |  |
| [`components/EventDateField.tsx`](<../../apps/mobile/src/components/EventDateField.tsx>) | [S037](02_SCREEN_SPECIFICATIONS.md#s037) | EventDateField:21 |  |
| [`components/GridBackground.tsx`](<../../apps/mobile/src/components/GridBackground.tsx>) | 共有処理/レイアウト（04参照） | GridBackground:5 |  |
| [`components/LocationPicker.tsx`](<../../apps/mobile/src/components/LocationPicker.tsx>) | 共有処理/レイアウト（04参照） | LocationPicker:7 | ../lib/mapStyle, ./Page |
| [`components/MemberRow.tsx`](<../../apps/mobile/src/components/MemberRow.tsx>) | [S040](02_SCREEN_SPECIFICATIONS.md#s040) [D006](02_SCREEN_SPECIFICATIONS.md#d006) | MemberRow:6 | ./Page, ./EventDateField, ../hooks/useMemberActions, ../lib/member |
| [`components/Page.tsx`](<../../apps/mobile/src/components/Page.tsx>) | 共有処理/レイアウト（04参照） | Page:6, Action:54, Empty:75, ui:82 | ./GridBackground |
| [`components/PinListItem.tsx`](<../../apps/mobile/src/components/PinListItem.tsx>) | 共有処理/レイアウト（04参照） | PinListItem:4 | ../lib/mapNavigation |
| [`components/PresenceHeader.tsx`](<../../apps/mobile/src/components/PresenceHeader.tsx>) | 共有処理/レイアウト（04参照） | PresenceHeader:7 | ./Avatar, ./streetMapStyles, ../lib/presenceHeader |
| [`components/StreetChat.tsx`](<../../apps/mobile/src/components/StreetChat.tsx>) | [S028](02_SCREEN_SPECIFICATIONS.md#s028) [S029](02_SCREEN_SPECIFICATIONS.md#s029) [D014](02_SCREEN_SPECIFICATIONS.md#d014) | StreetChat:23, menu:52 | ./Avatar, ../hooks/useStreetChat, ./Page |
| [`components/StreetEntrySheet.tsx`](<../../apps/mobile/src/components/StreetEntrySheet.tsx>) | [S026](02_SCREEN_SPECIFICATIONS.md#s026) [S027](02_SCREEN_SPECIFICATIONS.md#s027) [S056](02_SCREEN_SPECIFICATIONS.md#s056) [S057](02_SCREEN_SPECIFICATIONS.md#s057) | StreetEntrySheet:19 | ../hooks/useStreetMap, ../lib/development, ./streetMapStyles |
| [`components/StreetLogin.tsx`](<../../apps/mobile/src/components/StreetLogin.tsx>) | [S024](02_SCREEN_SPECIFICATIONS.md#s024) [S025](02_SCREEN_SPECIFICATIONS.md#s025) | StreetLogin:20 | ../hooks/useStreetMap, ../lib/development, ./streetMapStyles |
| [`components/StreetMapMarkers.tsx`](<../../apps/mobile/src/components/StreetMapMarkers.tsx>) | 共有処理/レイアウト（04参照） | StreetMapMarkers:11 | ./EventCloudPin, ./Avatar, ../lib/events, ../lib/recruitments, ../lib/presence, ./streetMapStyles |
| [`components/TabIcon.tsx`](<../../apps/mobile/src/components/TabIcon.tsx>) | 共有処理/レイアウト（04参照） | TabIcon:5 |  |
| [`components/streetMapStyles.ts`](<../../apps/mobile/src/components/streetMapStyles.ts>) | 共有処理/レイアウト（04参照） | streetMapStyles:2 |  |

## hooks

| ソース | 画面対応 | シンボル:行 | 直接のローカル依存 |
| --- | --- | --- | --- |
| [`hooks/useAccountAccess.ts`](<../../apps/mobile/src/hooks/useAccountAccess.ts>) | 共有処理/レイアウト（04参照） | AccessStatus:4, AccountAccessContext:13, useAccountAccess:18 | ../lib/native |
| [`hooks/useChatComposer.ts`](<../../apps/mobile/src/hooks/useChatComposer.ts>) | 共有処理/レイアウト（04参照） | useChatComposer:9, send:49, revise:80 | ../lib/commands, ../lib/native |
| [`hooks/useEmailChange.ts`](<../../apps/mobile/src/hooks/useEmailChange.ts>) | 共有処理/レイアウト（04参照） | useEmailChange:5, run:56, send:79, verify:91 | ../lib/native |
| [`hooks/useEventDetail.ts`](<../../apps/mobile/src/hooks/useEventDetail.ts>) | 共有処理/レイアウト（04参照） | useEventDetail:9, act:68, loadRoster:104 | ../lib/native, ../lib/events, ../lib/streetChanges |
| [`hooks/useEventEditor.ts`](<../../apps/mobile/src/hooks/useEventEditor.ts>) | 共有処理/レイアウト（04参照） | useEventEditor:6, save:44, useLatest:85 | ../lib/eventInput, ../lib/native, ../lib/events |
| [`hooks/useHomePins.ts`](<../../apps/mobile/src/hooks/useHomePins.ts>) | 共有処理/レイアウト（04参照） | useHomePins:10 | ../lib/localBlocks, ../lib/native, ../lib/recruitments, ../lib/events, ../lib/streetChanges |
| [`hooks/useInvitations.ts`](<../../apps/mobile/src/hooks/useInvitations.ts>) | 共有処理/レイアウト（04参照） | useInvitations:13, act:75 | ../lib/commands, ./useAccountAccess, ../lib/native |
| [`hooks/useMemberActions.ts`](<../../apps/mobile/src/hooks/useMemberActions.ts>) | 共有処理/レイアウト（04参照） | useMemberActions:5, act:12, restrict:30, saveLimit:38 | ../lib/native, ../lib/member |
| [`hooks/useMembers.ts`](<../../apps/mobile/src/hooks/useMembers.ts>) | 共有処理/レイアウト（04参照） | useMembers:6 | ../lib/native, ../lib/member |
| [`hooks/useModeration.ts`](<../../apps/mobile/src/hooks/useModeration.ts>) | 共有処理/レイアウト（04参照） | useModeration:18, act:62 | ../lib/native, ../lib/streetChanges |
| [`hooks/useNotifications.ts`](<../../apps/mobile/src/hooks/useNotifications.ts>) | 共有処理/レイアウト（04参照） | Notice:7, useNotifications:16, markRead:69 | ../lib/native, ../lib/streetChanges |
| [`hooks/useOperatorDashboard.ts`](<../../apps/mobile/src/hooks/useOperatorDashboard.ts>) | 共有処理/レイアウト（04参照） | useOperatorDashboard:13, run:113, enroll:130, verify:138, revoke:147 | ../lib/native |
| [`hooks/usePinCreation.ts`](<../../apps/mobile/src/hooks/usePinCreation.ts>) | 共有処理/レイアウト（04参照） | usePinCreation:11, revise:60, locate:88, publish:118 | ../lib/eventInput, ../lib/pinDraft, ../lib/commands, ../lib/native |
| [`hooks/useProfile.ts`](<../../apps/mobile/src/hooks/useProfile.ts>) | 共有処理/レイアウト（04参照） | useProfile:5, perform:29 | ../lib/native, ../lib/avatar |
| [`hooks/usePushNotifications.ts`](<../../apps/mobile/src/hooks/usePushNotifications.ts>) | [S046](02_SCREEN_SPECIFICATIONS.md#s046) | usePushLifecycle:6, usePushPermission:41 | ../lib/native |
| [`hooks/useRecruitmentDetail.ts`](<../../apps/mobile/src/hooks/useRecruitmentDetail.ts>) | 共有処理/レイアウト（04参照） | useRecruitmentDetail:9, act:86 | ../lib/localBlocks, ../lib/native, ../lib/recruitments, ../lib/streetChanges |
| [`hooks/useStickerDetail.ts`](<../../apps/mobile/src/hooks/useStickerDetail.ts>) | 共有処理/レイアウト（04参照） | useStickerDetail:5, step:43, save:85, cancel:112 | ../lib/native, ../lib/stickers |
| [`hooks/useStickerRegistration.ts`](<../../apps/mobile/src/hooks/useStickerRegistration.ts>) | 共有処理/レイアウト（04参照） | useStickerRegistration:10, create:44, cancelPending:68 | ../lib/native, ../lib/commands, ../lib/stickers |
| [`hooks/useStreetChat.ts`](<../../apps/mobile/src/hooks/useStreetChat.ts>) | 共有処理/レイアウト（04参照） | Message:9, useStreetChat:21, action:131, toggleExpanded:155, beginHistory:161, loadMore:165, reload:169, followLatest:172 | ../lib/localBlocks, ../lib/chatWindow, ../lib/streetChanges, ./useAccountAccess, ../lib/native, ./useChatComposer |
| [`hooks/useStreetMap.ts`](<../../apps/mobile/src/hooks/useStreetMap.ts>) | [S060](02_SCREEN_SPECIFICATIONS.md#s060) [D015](02_SCREEN_SPECIFICATIONS.md#d015) [D016](02_SCREEN_SPECIFICATIONS.md#d016) | useStreetMap:44, login:227, exit:244, enterFixture:261, scan:281, performScan:293, writeTestTag:345, logout:395 | ../lib/localBlocks, ../lib/streetChanges, ../lib/gatewayConnection, ../lib/native, ../lib/recruitments, ../lib/events, ../lib/development |
| [`hooks/useWithdrawal.ts`](<../../apps/mobile/src/hooks/useWithdrawal.ts>) | 共有処理/レイアウト（04参照） | useWithdrawal:5, begin:13, finish:33 | ../lib/native |

## lib

| ソース | 画面対応 | シンボル:行 | 直接のローカル依存 |
| --- | --- | --- | --- |
| [`lib/avatar.ts`](<../../apps/mobile/src/lib/avatar.ts>) | [S044](02_SCREEN_SPECIFICATIONS.md#s044) [S058](02_SCREEN_SPECIFICATIONS.md#s058) | Profile:6, imageErrorMessage:12, discard:23, chooseImage:32, convertAndUpload:61, chooseAvatar:102, StreetIconState:109, uploadImage:117, chooseStreetIcon:137 | ./jpegMetadata, ./native |
| [`lib/chatWindow.ts`](<../../apps/mobile/src/lib/chatWindow.ts>) | 共有処理/レイアウト（04参照） | ChatCursor:1, atOrBefore:2, readChatWindow:10 |  |
| [`lib/commands.ts`](<../../apps/mobile/src/lib/commands.ts>) | 共有処理/レイアウト（04参照） | storageKey:5, read:15, remove:27, pendingCommand:32, submitCommand:35, cancelPendingCommand:94 | ./native |
| [`lib/development.ts`](<../../apps/mobile/src/lib/development.ts>) | 共有処理/レイアウト（04参照） | localHost:4, nfcDisabled:25, localEntry:28 | ./native |
| [`lib/eventInput.ts`](<../../apps/mobile/src/lib/eventInput.ts>) | 共有処理/レイアウト（04参照） | eventInputError:2 |  |
| [`lib/events.ts`](<../../apps/mobile/src/lib/events.ts>) | 共有処理/レイアウト（04参照） | StreetEvent:1, countdown:17 |  |
| [`lib/gatewayConnection.ts`](<../../apps/mobile/src/lib/gatewayConnection.ts>) | 共有処理/レイアウト（04参照） | gatewayConnection:4, retry:15, open:26 |  |
| [`lib/jpegMetadata.ts`](<../../apps/mobile/src/lib/jpegMetadata.ts>) | 共有処理/レイアウト（04参照） | stripJpegMetadata:2 |  |
| [`lib/localBlocks.ts`](<../../apps/mobile/src/lib/localBlocks.ts>) | 共有処理/レイアウト（04参照） | localBlocks:5 |  |
| [`lib/mapNavigation.ts`](<../../apps/mobile/src/lib/mapNavigation.ts>) | 共有処理/レイアウト（04参照） | openMapAt:5 |  |
| [`lib/mapStyle.ts`](<../../apps/mobile/src/lib/mapStyle.ts>) | 共有処理/レイアウト（04参照） | mapStyle:3 |  |
| [`lib/member.ts`](<../../apps/mobile/src/lib/member.ts>) | 共有処理/レイアウト（04参照） | Member:1 |  |
| [`lib/native.ts`](<../../apps/mobile/src/lib/native.ts>) | 共有処理/レイアウト（04参照） | Visit:3, NativeState:11, Snapshot:17, configure:96, native:106, streetID:127, url:129, key:130, displayClock:132 | ./sessionState |
| [`lib/pinDraft.ts`](<../../apps/mobile/src/lib/pinDraft.ts>) | 共有処理/レイアウト（04参照） | PinDraft:2, updateDraft:21, clearDraft:25, usePinDraft:29 |  |
| [`lib/presence.ts`](<../../apps/mobile/src/lib/presence.ts>) | 共有処理/レイアウト（04参照） | splitCount:2, liveCells:11 | ./native |
| [`lib/presenceHeader.ts`](<../../apps/mobile/src/lib/presenceHeader.ts>) | 共有処理/レイアウト（04参照） | visiblePresenceIcons:2 |  |
| [`lib/recruitments.ts`](<../../apps/mobile/src/lib/recruitments.ts>) | 共有処理/レイアウト（04参照） | Recruitment:1 |  |
| [`lib/sessionState.ts`](<../../apps/mobile/src/lib/sessionState.ts>) | 共有処理/レイアウト（04参照） | sessionState:7 | ./localBlocks, ./pinDraft |
| [`lib/stickers.ts`](<../../apps/mobile/src/lib/stickers.ts>) | 共有処理/レイアウト（04参照） | StickerDraft:3, localStickerAdapter:12, stickerTouch:13 | ./development |
| [`lib/streetChanges.ts`](<../../apps/mobile/src/lib/streetChanges.ts>) | 共有処理/レイアウト（04参照） | streetChanges:3 |  |

## TypeScriptレスポンス/状態型（ソース抜粋）

### app/blocks.tsx

[`app/blocks.tsx`](<../../apps/mobile/src/app/blocks.tsx>)

```ts
type Block = { account_id: string; display_name: string };
```

### app/stickers/area.tsx

[`app/stickers/area.tsx`](<../../apps/mobile/src/app/stickers/area.tsx>)

```ts
type Placement = {
  tag_id: string;
  title: string;
  longitude: number;
  latitude: number;
  active: boolean;
  retired: boolean;
  revision: number;
};
type Preview = {
  valid: boolean;
  id?: string;
  area_version: number;
  boundary?: GeoJSON.Polygon;
};
```

### components/EventDateField.tsx

[`components/EventDateField.tsx`](<../../apps/mobile/src/components/EventDateField.tsx>)

```ts
type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  suggested?: string;
};
```

### hooks/useEventDetail.ts

[`hooks/useEventDetail.ts`](<../../apps/mobile/src/hooks/useEventDetail.ts>)

```ts
type Participant = { account_id: string; display_name: string };
```

### hooks/useInvitations.ts

[`hooks/useInvitations.ts`](<../../apps/mobile/src/hooks/useInvitations.ts>)

```ts
type Invite = {
  id: string;
  expires_at: string;
  used: boolean;
  revoked: boolean;
  expired?: boolean;
};
```

### hooks/useModeration.ts

[`hooks/useModeration.ts`](<../../apps/mobile/src/hooks/useModeration.ts>)

```ts
type Report = {
  id: string;
  target_kind: string;
  target_id: string;
  reason: string;
  description: string;
  evidence: { body?: string; title?: string; description?: string };
  created_at: string;
  review_due: boolean;
};
```

### hooks/useNotifications.ts

[`hooks/useNotifications.ts`](<../../apps/mobile/src/hooks/useNotifications.ts>)

```ts
export type Notice = {
  id: string;
  event_id: string;
  title: string;
  kind: "changed" | "canceled";
  created_at: string;
  read: boolean;
};
```

### hooks/useOperatorDashboard.ts

[`hooks/useOperatorDashboard.ts`](<../../apps/mobile/src/hooks/useOperatorDashboard.ts>)

```ts
type Invite = {
  id: string;
  issuer_name: string | null;
  recipient_name: string | null;
  used_at: string | null;
  revoked_at: string | null;
  expires_at: string;
  created_at: string;
};
```

### hooks/useStreetChat.ts

[`hooks/useStreetChat.ts`](<../../apps/mobile/src/hooks/useStreetChat.ts>)

```ts
export type Message = {
  id: string;
  author_id: string | null;
  display_name: string;
  avatar_path?: string;
  avatar_updated_at?: string;
  body: string | null;
  created_at: string;
  deleted: boolean;
  kind: "text" | "arrival";
  mine: boolean;
};
```

### lib/avatar.ts

[`lib/avatar.ts`](<../../apps/mobile/src/lib/avatar.ts>)

```ts
export type Profile = {
  display_name: string;
  avatar_path?: string;
  avatar_updated_at?: string;
  avatar_upload_path: string;
};
export type StreetIconState = {
  contribution_id: string | null;
  contribution_path: string | null;
  daily_path: string | null;
  contributed: boolean;
  day: string;
  next_shuffle_at: string;
};
```

### lib/chatWindow.ts

[`lib/chatWindow.ts`](<../../apps/mobile/src/lib/chatWindow.ts>)

```ts
export type ChatCursor = { id: string; created_at: string };
```

### lib/commands.ts

[`lib/commands.ts`](<../../apps/mobile/src/lib/commands.ts>)

```ts
type Pending = { id: string; count: number };
```

### lib/events.ts

[`lib/events.ts`](<../../apps/mobile/src/lib/events.ts>)

```ts
export type StreetEvent = {
  id: string;
  street_id: string;
  title: string;
  description: string;
  longitude: number;
  latitude: number;
  starts_at: string;
  ends_at: string;
  capacity: number;
  revision: number;
  mine: boolean;
  count: number;
  joined: boolean;
  registration_revision: number;
};
```

### lib/member.ts

[`lib/member.ts`](<../../apps/mobile/src/lib/member.ts>)

```ts
export type Member = {
  account_id: string;
  display_name: string;
  active: boolean;
  withdrawn_at: string | null;
  chat_restricted_until: string | null;
  weekly_limit: number;
  invite_paused: boolean;
};
```

### lib/native.ts

[`lib/native.ts`](<../../apps/mobile/src/lib/native.ts>)

```ts
export type Visit = {
  visit_id: string;
  street_id: string;
  state: "active" | "ended" | "expired";
  can_update: boolean;
  expires_at: string;
  last_seq: string;
};
export type NativeState = {
  observing: boolean;
  status: string;
  pending_exit: boolean;
  visit: Partial<Visit>;
};
export type Snapshot = {
  server_time: string;
  checked_in_count: number;
  presence_count: number;
  cells: {
    cell_id: string;
    area_version: string;
    grid_version: string;
    anchor: { longitude: number; latitude: number };
    expiry_groups: {
      expires_at: string;
      count: number;
      icons?: (string | null)[];
    }[];
  }[];
};
```

### lib/pinDraft.ts

[`lib/pinDraft.ts`](<../../apps/mobile/src/lib/pinDraft.ts>)

```ts
export type PinDraft = {
  kind: "event" | "recruitment";
  title: string;
  description: string;
  starts: string;
  ends: string;
  capacity: string;
  location?: [number, number];
};
```

### lib/recruitments.ts

[`lib/recruitments.ts`](<../../apps/mobile/src/lib/recruitments.ts>)

```ts
export type Recruitment = {
  id: string;
  title: string;
  longitude: number;
  latitude: number;
  expires_at: string;
  revision: number;
  mine: boolean;
  author_id: string;
  display_name: string;
};
```

### lib/sessionState.ts

[`lib/sessionState.ts`](<../../apps/mobile/src/lib/sessionState.ts>)

```ts
type Session = { signed_in: boolean; email: string };
```

### lib/stickers.ts

[`lib/stickers.ts`](<../../apps/mobile/src/lib/stickers.ts>)

```ts
export type StickerDraft = {
  id: string;
  tag_id: string;
  title: string;
  phase: "draft" | "written" | "verified" | "installed" | "published";
  revision: number;
  longitude: number;
  latitude: number;
};
```

## API操作と呼出元・SQL実装

読み書きの実呼出から抽出。同一operationを委譲/置換するmigrationも含む。SQLは昇順適用後の定義が有効。動的operationは下の補足を参照。

| operation | UI側呼出元:行 | SQLの定義/委譲参照 |
| --- | --- | --- |
| block_list | app/blocks.tsx:15 | [202610300003_chat_read.sql:23](../../supabase/migrations/202610300003_chat_read.sql#L23)<br>[202610300016_avatars.sql:56](../../supabase/migrations/202610300016_avatars.sql#L56)<br>[202610300019_anonymous_moderation.sql:68](../../supabase/migrations/202610300019_anonymous_moderation.sql#L68) |
| block_set | app/blocks.tsx:35 | [202610300003_chat_read.sql:23](../../supabase/migrations/202610300003_chat_read.sql#L23)<br>[202610300016_avatars.sql:56](../../supabase/migrations/202610300016_avatars.sql#L56)<br>[202610300019_anonymous_moderation.sql:68](../../supabase/migrations/202610300019_anonymous_moderation.sql#L68) |
| chat_list | hooks/useStreetChat.ts:53 | [202610300003_chat_read.sql:23](../../supabase/migrations/202610300003_chat_read.sql#L23)<br>[202610300016_avatars.sql:56](../../supabase/migrations/202610300016_avatars.sql#L56)<br>[202610300019_anonymous_moderation.sql:68](../../supabase/migrations/202610300019_anonymous_moderation.sql#L68) |
| chat_send | hooks/useChatComposer.ts:65 | [202610300005_commands_chat.sql:17](../../supabase/migrations/202610300005_commands_chat.sql#L17)<br>[202610300011_command_cancel.sql:13](../../supabase/migrations/202610300011_command_cancel.sql#L13)<br>[202610300014_sticker_preparation.sql:93](../../supabase/migrations/202610300014_sticker_preparation.sql#L93)<br>[202610300027_invitation_commands.sql:23](../../supabase/migrations/202610300027_invitation_commands.sql#L23) |
| command_execute | lib/commands.ts:81 | [202610300005_commands_chat.sql:37](../../supabase/migrations/202610300005_commands_chat.sql#L37)<br>[202610300011_command_cancel.sql:7](../../supabase/migrations/202610300011_command_cancel.sql#L7)<br>[202610300014_sticker_preparation.sql:87](../../supabase/migrations/202610300014_sticker_preparation.sql#L87)<br>[202610300027_invitation_commands.sql:17](../../supabase/migrations/202610300027_invitation_commands.sql#L17) |
| command_prepare | lib/commands.ts:65 | [202610300005_commands_chat.sql:37](../../supabase/migrations/202610300005_commands_chat.sql#L37)<br>[202610300011_command_cancel.sql:7](../../supabase/migrations/202610300011_command_cancel.sql#L7)<br>[202610300014_sticker_preparation.sql:87](../../supabase/migrations/202610300014_sticker_preparation.sql#L87)<br>[202610300027_invitation_commands.sql:17](../../supabase/migrations/202610300027_invitation_commands.sql#L17) |
| event_create | hooks/usePinCreation.ts:166 | [202610300005_commands_chat.sql:43](../../supabase/migrations/202610300005_commands_chat.sql#L43)<br>[202610300006_events.sql:42](../../supabase/migrations/202610300006_events.sql#L42)<br>[202610300011_command_cancel.sql:13](../../supabase/migrations/202610300011_command_cancel.sql#L13)<br>[202610300014_sticker_preparation.sql:93](../../supabase/migrations/202610300014_sticker_preparation.sql#L93)<br>[202610300027_invitation_commands.sql:23](../../supabase/migrations/202610300027_invitation_commands.sql#L23) |
| event_edit | hooks/useEventEditor.ts:55 | [202610300006_events.sql:58](../../supabase/migrations/202610300006_events.sql#L58)<br>[202610300017_event_integration.sql:6](../../supabase/migrations/202610300017_event_integration.sql#L6) |
| event_get | hooks/useEventDetail.ts:28 / hooks/useEventEditor.ts:21 / hooks/useEventEditor.ts:70 | [202610300006_events.sql:58](../../supabase/migrations/202610300006_events.sql#L58)<br>[202610300017_event_integration.sql:6](../../supabase/migrations/202610300017_event_integration.sql#L6) |
| event_list | hooks/useHomePins.ts:27 / hooks/useStreetMap.ts:99 | [202610300006_events.sql:58](../../supabase/migrations/202610300006_events.sql#L58)<br>[202610300017_event_integration.sql:6](../../supabase/migrations/202610300017_event_integration.sql#L6) |
| event_roster | hooks/useEventDetail.ts:110 | [202610300006_events.sql:58](../../supabase/migrations/202610300006_events.sql#L58)<br>[202610300017_event_integration.sql:6](../../supabase/migrations/202610300017_event_integration.sql#L6) |
| get_presence_snapshot | hooks/useStreetMap.ts:87 | [202610290001_core.sql:100](../../supabase/migrations/202610290001_core.sql#L100)<br>[202610300025_presence_icons.sql:8](../../supabase/migrations/202610300025_presence_icons.sql#L8) |
| get_street_config | hooks/useStreetMap.ts:94 | [202610290001_core.sql:100](../../supabase/migrations/202610290001_core.sql#L100) |
| invite_list | hooks/useInvitations.ts:33 | [202610300002_invitations.sql:14](../../supabase/migrations/202610300002_invitations.sql#L14)<br>[202610300012_member_operations.sql:73](../../supabase/migrations/202610300012_member_operations.sql#L73) |
| notification_list | hooks/useNotifications.ts:31 | [202610300006_events.sql:58](../../supabase/migrations/202610300006_events.sql#L58)<br>[202610300017_event_integration.sql:6](../../supabase/migrations/202610300017_event_integration.sql#L6) |
| notification_read | hooks/useNotifications.ts:75 | [202610300006_events.sql:58](../../supabase/migrations/202610300006_events.sql#L58)<br>[202610300017_event_integration.sql:6](../../supabase/migrations/202610300017_event_integration.sql#L6) |
| operator_invite_revoke | hooks/useOperatorDashboard.ts:150 | [202610300009_operators.sql:36](../../supabase/migrations/202610300009_operators.sql#L36)<br>[202610300032_operator_invite_cursor.sql:11](../../supabase/migrations/202610300032_operator_invite_cursor.sql#L11) |
| operator_invites | hooks/useOperatorDashboard.ts:38 | [202610300009_operators.sql:36](../../supabase/migrations/202610300009_operators.sql#L36)<br>[202610300032_operator_invite_cursor.sql:11](../../supabase/migrations/202610300032_operator_invite_cursor.sql#L11) |
| operator_members | hooks/useMembers.ts:31 | [202610300012_member_operations.sql:32](../../supabase/migrations/202610300012_member_operations.sql#L32)<br>[202610300018_withdrawal.sql:90](../../supabase/migrations/202610300018_withdrawal.sql#L90)<br>[202610300030_operator_member_status.sql:6](../../supabase/migrations/202610300030_operator_member_status.sql#L6) |
| operator_reports | hooks/useModeration.ts:32 | [202610300010_reports.sql:18](../../supabase/migrations/202610300010_reports.sql#L18)<br>[202610300013_moderation_controls.sql:32](../../supabase/migrations/202610300013_moderation_controls.sql#L32)<br>[202610300019_anonymous_moderation.sql:10](../../supabase/migrations/202610300019_anonymous_moderation.sql#L10) |
| operator_status | hooks/useEventDetail.ts:37 / hooks/useOperatorDashboard.ts:79 | [202610300009_operators.sql:31](../../supabase/migrations/202610300009_operators.sql#L31)<br>[202610300032_operator_invite_cursor.sql:6](../../supabase/migrations/202610300032_operator_invite_cursor.sql#L6) |
| placement_list | app/stickers/area.tsx:41 | [202610300015_area_publication.sql:19](../../supabase/migrations/202610300015_area_publication.sql#L19)<br>[202610300021_sticker_replacement.sql:41](../../supabase/migrations/202610300021_sticker_replacement.sql#L41) |
| profile_avatar_set | lib/avatar.ts:106 | [202610300016_avatars.sql:22](../../supabase/migrations/202610300016_avatars.sql#L22) |
| profile_get | hooks/useAccountAccess.ts:37 / hooks/useProfile.ts:14 / lib/avatar.ts:104 | [202610300001_profiles.sql:15](../../supabase/migrations/202610300001_profiles.sql#L15)<br>[202610300016_avatars.sql:30](../../supabase/migrations/202610300016_avatars.sql#L30) |
| profile_save | hooks/useProfile.ts:54 | [202610300001_profiles.sql:15](../../supabase/migrations/202610300001_profiles.sql#L15)<br>[202610300016_avatars.sql:37](../../supabase/migrations/202610300016_avatars.sql#L37) |
| recruitment_create | hooks/usePinCreation.ts:128 | [202610300005_commands_chat.sql:43](../../supabase/migrations/202610300005_commands_chat.sql#L43)<br>[202610300007_recruitments.sql:13](../../supabase/migrations/202610300007_recruitments.sql#L13)<br>[202610300011_command_cancel.sql:13](../../supabase/migrations/202610300011_command_cancel.sql#L13)<br>[202610300014_sticker_preparation.sql:93](../../supabase/migrations/202610300014_sticker_preparation.sql#L93)<br>[202610300027_invitation_commands.sql:23](../../supabase/migrations/202610300027_invitation_commands.sql#L23) |
| recruitment_get | hooks/useRecruitmentDetail.ts:28 | [202610300007_recruitments.sql:29](../../supabase/migrations/202610300007_recruitments.sql#L29) |
| recruitment_list | hooks/useHomePins.ts:31 / hooks/useStreetMap.ts:104 | [202610300007_recruitments.sql:29](../../supabase/migrations/202610300007_recruitments.sql#L29) |
| report_create | app/report.tsx:17 | [202610300010_reports.sql:18](../../supabase/migrations/202610300010_reports.sql#L18)<br>[202610300013_moderation_controls.sql:32](../../supabase/migrations/202610300013_moderation_controls.sql#L32)<br>[202610300019_anonymous_moderation.sql:10](../../supabase/migrations/202610300019_anonymous_moderation.sql#L10) |
| sticker_cancel | hooks/useStickerDetail.ts:119 | [202610300020_sticker_draft_edit.sql:7](../../supabase/migrations/202610300020_sticker_draft_edit.sql#L7) |
| sticker_create | app/stickers/area.tsx:75 / app/stickers/area.tsx:89 / hooks/useStickerRegistration.ts:48 | [202610300014_sticker_preparation.sql:19](../../supabase/migrations/202610300014_sticker_preparation.sql#L19)<br>[202610300021_sticker_replacement.sql:8](../../supabase/migrations/202610300021_sticker_replacement.sql#L8)<br>[202610300027_invitation_commands.sql:23](../../supabase/migrations/202610300027_invitation_commands.sql#L23) |
| sticker_edit | hooks/useStickerDetail.ts:93 | [202610300020_sticker_draft_edit.sql:7](../../supabase/migrations/202610300020_sticker_draft_edit.sql#L7) |
| sticker_get | hooks/useStickerDetail.ts:20 | [202610300014_sticker_preparation.sql:46](../../supabase/migrations/202610300014_sticker_preparation.sql#L46) |
| sticker_list | app/stickers/area.tsx:44 / hooks/useStickerRegistration.ts:28 | [202610300014_sticker_preparation.sql:46](../../supabase/migrations/202610300014_sticker_preparation.sql#L46) |
| sticker_preview | app/stickers/area.tsx:134 | [202610300015_area_publication.sql:19](../../supabase/migrations/202610300015_area_publication.sql#L19)<br>[202610300021_sticker_replacement.sql:41](../../supabase/migrations/202610300021_sticker_replacement.sql#L41) |
| sticker_publish | app/stickers/area.tsx:185 | [202610300015_area_publication.sql:19](../../supabase/migrations/202610300015_area_publication.sql#L19)<br>[202610300021_sticker_replacement.sql:41](../../supabase/migrations/202610300021_sticker_replacement.sql#L41) |
| sticker_step | hooks/useStickerDetail.ts:67 | [202610300014_sticker_preparation.sql:46](../../supabase/migrations/202610300014_sticker_preparation.sql#L46) |
| sticker_suspend | app/stickers/area.tsx:239 | [202610300015_area_publication.sql:19](../../supabase/migrations/202610300015_area_publication.sql#L19)<br>[202610300021_sticker_replacement.sql:41](../../supabase/migrations/202610300021_sticker_replacement.sql#L41) |
| street_icon_get | app/street-icons.tsx:24 / hooks/useAccountAccess.ts:43 | [202610300023_street_icon_pool.sql:76](../../supabase/migrations/202610300023_street_icon_pool.sql#L76)<br>[202610300024_icon_enrollment.sql:17](../../supabase/migrations/202610300024_icon_enrollment.sql#L17)<br>[202610300031_unpublished_icon_expiry.sql:7](../../supabase/migrations/202610300031_unpublished_icon_expiry.sql#L7) |
| street_icon_publish | lib/avatar.ts:144 | [202610300023_street_icon_pool.sql:76](../../supabase/migrations/202610300023_street_icon_pool.sql#L76)<br>[202610300024_icon_enrollment.sql:17](../../supabase/migrations/202610300024_icon_enrollment.sql#L17)<br>[202610300031_unpublished_icon_expiry.sql:7](../../supabase/migrations/202610300031_unpublished_icon_expiry.sql#L7) |
| street_icon_remove | app/street-icons.tsx:48 | [202610300023_street_icon_pool.sql:76](../../supabase/migrations/202610300023_street_icon_pool.sql#L76)<br>[202610300024_icon_enrollment.sql:17](../../supabase/migrations/202610300024_icon_enrollment.sql#L17)<br>[202610300031_unpublished_icon_expiry.sql:7](../../supabase/migrations/202610300031_unpublished_icon_expiry.sql#L7) |
| time | hooks/useEventEditor.ts:22 / lib/native.ts:136 | [202610290001_core.sql:96](../../supabase/migrations/202610290001_core.sql#L96) |
| withdraw_confirm | hooks/useWithdrawal.ts:44 | [202610300018_withdrawal.sql:27](../../supabase/migrations/202610300018_withdrawal.sql#L27)<br>[202610310037_withdrawal_relations.sql:6](../../supabase/migrations/202610310037_withdrawal_relations.sql#L6) |
| withdraw_prepare | hooks/useWithdrawal.ts:20 | [202610300018_withdrawal.sql:27](../../supabase/migrations/202610300018_withdrawal.sql#L27)<br>[202610310037_withdrawal_relations.sql:6](../../supabase/migrations/202610310037_withdrawal_relations.sql#L6) |

動的操作の補足：useMemberActions.act→operator_chat_restrict/operator_chat_restore/operator_invite_policy/operator_member_state、useModeration→operator_message_delete/operator_report_resolve、useEventDetail.act→event_register/event_cancel、useStreetChat.mutate→chat_delete/block_set。Auth sendOTP/verifyOTP/changeEmail/mfa系はAPIClientのAuth HTTP。入街/観測/退出はSwift VisitLifecycleとPresenceEngine。共通command内部operation（command_prepare/command_execute/command_cancel等）はlib/commands.tsとSQL005以降を参照。画面に直接現れないworker/cleanupを追加画面として数えない。

## Native実装一覧

- [APIClient.swift](../../apps/mobile/modules/presence-native/ios/APIClient.swift)
- [ObservationCore.swift](../../apps/mobile/modules/presence-native/ios/ObservationCore.swift)
- [PresenceEngine.swift](../../apps/mobile/modules/presence-native/ios/PresenceEngine.swift)
- [PresenceNativeModule.swift](../../apps/mobile/modules/presence-native/ios/PresenceNativeModule.swift)
- [PushNotifications.swift](../../apps/mobile/modules/presence-native/ios/PushNotifications.swift)
- [ServiceError.swift](../../apps/mobile/modules/presence-native/ios/ServiceError.swift)
- [TemporaryImageCleanup.swift](../../apps/mobile/modules/presence-native/ios/TemporaryImageCleanup.swift)
- [VisitLifecycle.swift](../../apps/mobile/modules/presence-native/ios/VisitLifecycle.swift)

## 調査資料

- [PROJECT_CONTEXT](../PROJECT_CONTEXT.md)
- [MVP_REQUIREMENTS](../MVP_REQUIREMENTS.md)
- [DECISIONS](../DECISIONS.md)
- [OPEN_QUESTIONS](../OPEN_QUESTIONS.md)
- [ACCEPTANCE](../ACCEPTANCE.md)
- [MVP_TASKS](../MVP_TASKS.md)
- [MVP_REMAINING](../MVP_REMAINING.md)
- [LOGIC_PROGRESS](../LOGIC_PROGRESS.md)
- [TECH_VALIDATION](../TECH_VALIDATION.md)
- [UI_LOGIC_CONTRACT](../UI_LOGIC_CONTRACT.md)
- [NAVIGATION_ACCEPTANCE](../NAVIGATION_ACCEPTANCE.md)
- [SCREEN_FLOW_REVIEW](../SCREEN_FLOW_REVIEW.md)
- [PRESENCE_DISPLAY](../PRESENCE_DISPLAY.md)
- [CHAT_MODERATION_DESIGN](../CHAT_MODERATION_DESIGN.md)
- [PINS_AND_EVENTS_DESIGN](../PINS_AND_EVENTS_DESIGN.md)
- [NFC_OPERATIONS](../NFC_OPERATIONS.md)
- [PUSH_DELIVERY](../PUSH_DELIVERY.md)
- [BUG_BACKLOG](../BUG_BACKLOG.md)

参考UI書き出し（製品コードとは別）：

- [iphone-17-76.png](../reference/ui/iphone-17-76.png)
- [iphone-17-77.png](../reference/ui/iphone-17-77.png)
- [iphone-17-78.png](../reference/ui/iphone-17-78.png)
- [iphone-17-79.png](../reference/ui/iphone-17-79.png)
- [iphone-17-81.png](../reference/ui/iphone-17-81.png)
- [iphone-17-82.png](../reference/ui/iphone-17-82.png)
- [iphone-17-83.png](../reference/ui/iphone-17-83.png)
- [iphone-17-84.png](../reference/ui/iphone-17-84.png)
- [map-toggle-correction.png](../reference/ui/map-toggle-correction.png)
