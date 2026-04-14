# UpdateCamera

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `camera` | ルート（union により任意） | 通常はあり | — | `Camera` | 型定義上 `undefined` の可能性 |
| `latestFirmwareUpdate` | ルート | いいえ | — | object \| null | バージョン説明 |
| ファームウェア更新ボタン | ボタン | — | — | — | バージョン更新 API |

## 3. ナビゲーション

- **主な遷移元:** `SettingAI`。
- **戻る:** `goBack()`。

## 4. ロジック・API

- `cameraService.getDetailCamera(camera.id)` — 状態更新。
- `cameraService.updateVersionCamera(camera.id)` — OTA／バージョン更新の実行。
