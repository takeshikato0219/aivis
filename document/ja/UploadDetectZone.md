# UploadDetectZone

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `camera` | ルート | はい | — | `Camera` | |
| ゾーン種別選択 | リスト／ピッカー | — | — | — | `detectionZoneService.getType()` |
| ストリーム | WebView／プレビュー | — | — | — | API からの URL |

## 3. ナビゲーション

- **パラメータ:** `UploadDetectZone`: `{ camera }`。
- **遷移先:** `DetectionZoneSetup`（`zoneType`, `typeId`, `liveUrl` を渡して push）。

## 4. ロジック・API

- `cameraService.getLiveStreamUrl(camera.id)`。
- `detectionZoneService.getType()` — ゾーン種別マスタ。
