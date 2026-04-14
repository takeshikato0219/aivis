# WorkSchedule

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `camera` | ルート | はい | — | `Camera` | |
| `ruleId` | ルート | はい | — | `string` | |
| `title`, `code` | ルート | はい | — | `string` | 表示・保存 |
| スケジュール（日時ブロック） | フォーム + カレンダー | — | — | — | UI はソース参照 |
| `GroupedMemberPicker` | 子コンポーネント | — | — | — | メンバー選択・検索 |

## 3. ナビゲーション

- **戻る:** 保存後（Alert）で `goBack()`。

## 4. ロジック・API

- `cameraService.getWorkScheduleForRule(camera.id, ruleId)` — 取得。
- `cameraService.updateWorkScheduleForRule(...)` — 更新。
- `faceService.getMembers`, `getMemberRelationships` — メンバー割当（ファイル内でページング）。
