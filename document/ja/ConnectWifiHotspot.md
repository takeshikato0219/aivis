# ConnectWifiHotspot

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `wifi` | ルート | はい（オブジェクト） | `{ ssid: 'AIVIS_AP_XXXX' }` | `any` | カメラホットスポットの SSID |
| ホットスポットパスワード | カスタム `TextInput` | タップ時は検証可 | `''` | `string` | `useInput` + `isPasswordWifi`（`handleConnect` は主に遷移のみ） |
| 接続 | ボタン | — | — | — | → `NetworkSetup` |

## 3. ナビゲーション

- **パラメータ:** `ConnectWifiHotspot`: `{ wifi: any }`。
- **遷移先:** `NetworkSetup`（`{ cameraAp: wifi.ssid }`）。
- **戻る:** `goBack()`。

## 4. ロジック・API

- 主に SSID を `NetworkSetup` へ引き渡し。本画面から REST は呼ばない。
