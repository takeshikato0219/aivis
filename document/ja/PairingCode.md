# PairingCode

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `device` | ルート | 推奨 | — | BLE シリアライズ可能デバイス | id, name, localName 等 |
| `pairingCode` | ルート | いいえ | `''` | `string` | 入力欄のプリフィル |
| `isWifi` | ルート | いいえ | — | `boolean` | フロー分岐 |
| 6 桁 PIN | `TextInput` | はい（6 文字） | — | `string` | A–Z, 0–9 のみ；次の入力へ自動フォーカス |
| 送信 | — | — | — | — | `connect(device, code)` |

## 3. ナビゲーション

- **遷移先:** ペアリング成功時 `NetworkSetup`（`{ cameraAp: デバイス名 }`）。
- **戻る:** `goBack()`（事前に BLE 切断）。

## 4. ロジック・API

- `useJetsonBLE().connect(device, code)` — BLE。
- 戻るとき `jetsonBLEService.disconnect()`。
- エラー: `INVALID_PIN` → i18n メッセージ；その他 → 接続失敗。
