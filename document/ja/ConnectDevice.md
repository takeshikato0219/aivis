# ConnectDevice

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `RadarScan` | 子コンポーネント | — | — | — | デバイス数に応じたドットアニメーション |
| BLE デバイス一覧 | `FlatList`／カード | — | `devices` | `SerializableDevice[]` | `useJetsonBLE` |
| 再スキャン／Bluetooth 設定 | ボタン | — | — | — | `BleManager`、BT オフ時は `Alert` |
| ヘッダー戻る | — | — | — | — | → `Home` |

## 3. ナビゲーション

- **遷移元:** `Home`（カメラ追加）。
- **遷移先:** `PairingCode`（`{ device, pairingCode: '' }`）。
- 本画面から `ConnectWifiHotspot` への直接遷移はコード上なし。

## 4. ロジック・API

- **BLE:** `useJetsonBLE` — `startScan`, `stopScan`, `devices`。
- **REST なし**；続きは `PairingCode`／`jetsonBLEService`。
