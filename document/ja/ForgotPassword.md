# ForgotPassword

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| メール | カスタム `TextInput` | はい | `''` | `string` | `isEmail` |
| 完了 | `TouchableOpacity` | — | — | — | パスワードリセット API 呼び出し |
| ログインへ | `TouchableOpacity` | — | — | — | スタックを `Login` にリセット |

## 3. ナビゲーション

- **遷移元:** `Login` → `ForgotPassword`。
- **遷移先:** `navigation.reset` で `Login`；または API 成功後の `Alert` で OK → `goBack()`。

## 4. ロジック・API

- `authService.forgotPassword(email)` — ネットワーク必須（`useAppSetup`）。
- 成功: サーバーメッセージを `Alert` 表示、OK で `goBack()`。
- 失敗: `useErrorHandler`。
