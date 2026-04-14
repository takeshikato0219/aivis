# Profile

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| アバター／ユーザー名 | `Image`, `Text` | — | Redux `user` | User | |
| プロフィール編集 | 行 | — | — | — | → `EditProfile` |
| パスワード変更 | 行 | — | — | — | → `ChangePassword` |
| 利用規約／プライバシー | リンク | — | — | — | `type` 付きで `Policy` |
| ログアウト | ボタン | — | — | — | ストレージ削除 + Redux |

## 3. ナビゲーション

- **遷移先:** `EditProfile`, `ChangePassword`, `Policy`。
- **戻る:** `goBack()`（ドロワーや Home から）。

## 4. ロジック・API

- `removeAuthData()`、`dispatch(logout())`、`appBadgeService.setBadgeCount(0)`。
- 表示のみのため API 不要。ユーザー情報は Redux から。
