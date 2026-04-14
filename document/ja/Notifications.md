# Notifications

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| 通知一覧 | Flat リスト／セクション | — | — | 通知アイテム | ルール・種別に依存 |
| フィルタ／ルール | `rulesService` 依存 | — | — | — | コード → アイコン・タイトル |
| 戻る | ヘッダー | — | — | — | `goBack()` |

## 3. ナビゲーション

- **パラメータ:** `Notifications`: `{ userId?: string }`。
- **遷移先:** 種別に応じて `CustomerReport`、`ListNotificationCamera`。
- **戻る:** `goBack()`。

## 4. ロジック・API

- `rulesService.getRules()` — メタデータ・フィルタ用。
- `notificationsService.getNotifications(...)` — 一覧取得。
- `notificationsService.updateNotificationSeen(id, true)` — 既読。
- `appBadgeService.getBadgeCount`／`setBadgeCount` — バッジ更新。
