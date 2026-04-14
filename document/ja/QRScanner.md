# QRScanner

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| カメラ権限 | Vision Camera API | OS 上必須 | — | — | プロンプト／設定へ誘導 |
| QR スキャン領域 | カメラビュー | — | — | — | `scanningEnabled`, `isSearching` |
| 手動ボタン | — | — | — | — | スキャン不可時 `CameraSetup` へ `qrData: null` |
| BLE／ペアリング検索 | `ActivityIndicator` | — | — | — | QR 取得後 |

## 3. ナビゲーション

- **遷移先:** `CameraSetup`（`qrData`）、カメラ登録成功後 `ConnectionSuccessful`。
- **戻る:** `goBack()`。

## 4. ロジック・API

- `cameraService.registerCamera(...)` — スキャン／BLE フロー後のデバイス登録。
- `cameraService.updateStatus()` — ステータス更新。
- `jetsonBLEService.disconnect()` — 画面遷移時に BLE 切断。
- カメラ権限: `Camera.getCameraPermissionStatus()` 等。
