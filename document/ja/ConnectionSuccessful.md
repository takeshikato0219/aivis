# ConnectionSuccessful

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `cameraData` | ルート | はい | — | `Camera` | 登録・命名 |
| ストリームプレビュー | WebView／動画 | — | — | — | TTL に応じて URL 更新 |
| CTA（ホーム／顔） | ボタン | — | — | — | 実装により `Home`／`ListFace` 等 |

## 3. ナビゲーション

- **パラメータ:** `ConnectionSuccessful`: `{ cameraData: Camera }`。
- **遷移先:** `Home`, `ListFace`（`{ type: '' }`）。

## 4. ロジック・API

- `cameraService.getLiveStreamUrl(cameraData.id)` — ライブ URL 取得、トークン期限前に更新スケジュール。
- `cameraService.registerCamera({...})` — QR／BLE フローに応じたデバイス登録完了。
