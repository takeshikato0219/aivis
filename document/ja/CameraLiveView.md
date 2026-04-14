# CameraLiveView

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `cameraId` | ルート | はい | — | `string` | |
| `cameraName` | ルート | いいえ | — | `string` | |
| `baseUrl` | ルート | いいえ | — | `string` | 任意ストリーム URL |
| WebView ストリーム | `WebView` + HTML/JS | — | — | — | フレーム取得、映像データ確認 |
| 録画操作 | ボタン | — | — | — | 録画開始／停止 |
| 戻る | — | — | — | — | `goBack()` |

## 3. ナビゲーション

- **パラメータ:** `CameraLive`: `{ cameraId, cameraName?, baseUrl? }`。
- **戻る:** `goBack()`。

## 4. ロジック・API

- `cameraService.getLiveStreamUrl(cameraId)` — URL とトークン更新タイミング。
- `recordingService.startRecording`／`stopRecording`／`saveToGallery`／`cleanSandbox`／`getRecordingDuration`。
- 最終フレームを `AsyncStorage`／ファイルに保存し、Home／Detail のサムネに利用。
