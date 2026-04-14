# SettingAI

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `camera` | ルート | はい | — | `Camera` | |
| `latestFirmwareUpdate` | ルート | いいえ | — | object \| null | ファーム情報 |
| メニュー（検知エリア／AI ルール／FW） | 行 | — | — | — | 各画面へ遷移 |
| カメラ削除 | 破壊的操作 | — | — | — | 確認 |

## 3. ナビゲーション

- **遷移先:** `UploadDetectZone`, `AiDetectionRules`, `UpdateCamera`, `Home`。
- **戻る:** `goBack()`。

## 4. ロジック・API

- `cameraService.getDetailCamera(camera.id)` — 詳細同期。
- `cameraService.deleteCamera(camera.id)` — デバイス削除。
