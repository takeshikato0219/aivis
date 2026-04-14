# DetectionZoneSetup

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `camera` | ルート | はい | — | `Camera` | |
| `zoneType` | ルート | いいえ | — | `'detection' \| 'restricted' \| 'entry_exit'` | |
| `typeId` | ルート | いいえ | — | `string` | ゾーン種別 |
| `liveUrl` | ルート | はい | — | `string` | WebView ストリーム |
| ゾーン描画 WebView | Canvas／JS ブリッジ | — | — | — | `postMessage` でフレーム／映像確認 |
| ポリゴン／ポイント | ジェスチャ | — | — | — | ゾーンペイロード保存 |

## 3. ナビゲーション

- **戻る:** 保存成功後（Alert OK）で `goBack()`。

## 4. ロジック・API

- `cameraService.getLiveStreamUrl(camera.id)` — URL 更新。
- `detectionZoneService.getZones(camera.id, typeId)` — 既存ゾーン読み込み。
- `detectionZoneService.createZone`／`updateZone` — ポリゴン／メタデータ保存。
- 注入 JS: フレーム取得、映像データ有無チェック。
