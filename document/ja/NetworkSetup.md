# NetworkSetup

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `cameraAp` | ルート | はい | — | `string` | AP／カメラ名 |
| Wi‑Fi／LAN／LTE タブ | `TABS` | — | `wifi` | union | アイコン + タイトル |
| Wi‑Fi 一覧（BLE） | リスト + 電波 | — | — | — | `wifiNetworks`, `wifiScanStatus` |
| Wi‑Fi パスワード | `TextInput` | Wi‑Fi 接続時 | — | `string` | `isPasswordWifi` |
| リンク状態 | インジケータ | — | — | — | Ethernet／LTE ポーリング |
| 接続進行 | プログレス／ローディング | — | — | — | `connecting`, `connectingNetSetup` |

## 3. ナビゲーション

- **パラメータ:** `NetworkSetup`: `{ cameraAp: string }`。
- **戻る:** `goBack()` または BLE フロー完了（ファイル後半の実装による）。

## 4. ロジック・API

- **BLE（Jetson）:** `useJetsonBLE` — `requestWiFiScan`, `sendWiFiCredentials`, `checkNetworkStatus`, `netSetupConnect`。
- **サービス:** `jetsonBLEService` — 切断、`NetCheckType`。
- **Redux:** `store.getState().ble` — `networkStatus`, Wi‑Fi 状態。
- デバイス側ネット設定に REST HTTP は使わない（BLE 経由）。
