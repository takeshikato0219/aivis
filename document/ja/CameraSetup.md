# CameraSetup

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `qrData` | ルート | はい（null 可） | `null` | `string \| null` | QRScanner から |
| `ssid` | RN `TextInput`／state | 入力 | `AIVIS_Home_5G` | `string` | 接続先 Wi‑Fi |
| `password` | TextInput | ネットワーク次第 | `''` | `string` | 表示切替 |
| `cameraName` | TextInput | 次へ進むために必要 | 例文あり | `string` | |
| `selectedLocation` | `LOCATIONS` から選択 | — | `リビング` | `string` | |
| `selectedScene` | `SCENES` | — | `aivis1` | `string` | |
| 保存して次へ | ボタン | — | — | — | → `SetupComplete` |

## 3. ナビゲーション

- **パラメータ:** `CameraSetup`: `{ qrData: string | null }`。
- **遷移先:** `SetupComplete` に `{ cameraName, ssid }`。
- **戻る:** `goBack()`。

## 4. ロジック・API

- Wi‑Fi／カメラ名のフォーム画面。**REST は直接呼ばない**（次ステップ／QR フロー用データ準備）。
