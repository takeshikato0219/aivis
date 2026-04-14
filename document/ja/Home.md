# Home

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| ワークフロータブ／「すべて」 | `activeIndex` に応じた UI | — | `0` | `number` | `facility_id` でカメラをフィルタ |
| カメラ一覧 | カード + `ScrollView`／さらに読み込み | — | `[]` | `Camera[]` | ページング `page`, `per_page: 20` |
| ドロワー | `DrawerMenu` | — | `isDrawerOpen` | `boolean` | 開いたときユーザー同期 |
| ベル | アイコン | — | — | — | バッジ `unreadCount` |
| カメラ追加（Bluetooth） | CTA | — | — | — | → `ConnectDevice` |
| ユーザーアバター | `Image` | — | Redux `user` | URL | 読み込み失敗時フォールバック |

## 3. ナビゲーション

- **遷移先:** `Detail`（`camera`, `workflowStatuses`）、`ConnectDevice`、`Notifications`（`userId` は任意）。
- **ヘッダー:** デフォルト非表示（`headerShown: false`）。

## 4. ロジック・API

- `cameraService.getWorkflowStatuses()` — 施設タブ用ステータス。
- `cameraService.getCameras({ sort_by, sort_order, page, per_page, facility_id })` — 一覧と追加読み込み。
- `cameraService.getDetailCamera(cam.id)` — リフレッシュ時にファームウェア情報など更新。
- `notificationsService.getNotifications({ is_seen: false, user_id })` — 未読件数。
- `appBadgeService.setBadgeCount` — アプリアイコンバッジ同期。
- ローカル: 最終フレームプレビュー用 `AsyncStorage`／`RNFS`（`camera_last_frame_*`）。
- ドロワー開時に `useUserSync`。
