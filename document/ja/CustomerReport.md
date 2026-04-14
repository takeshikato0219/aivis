# CustomerReport

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `title` | ルート | はい | — | `string` | |
| `icon` | ルート | はい | — | `string` | |
| `cameraId` | ルート | はい | — | `string` | |
| `detected_at` | ルート | いいえ | — | `string` | |
| レポート日付 | 日付操作 | — | `selectedDate` | `Date` | ±1 日 |

## 3. ナビゲーション

- **遷移元:** `Detail`, `Notifications`。
- **戻る:** `goBack()`。

## 4. ロジック・API

- `cameraService.reportCustomer(cameraId, { date: selectedDate })` — 日別の来客レポートデータ。
