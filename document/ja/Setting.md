# Setting

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| LINE 公式アカウントフォロー状態 | 行 + ローディング | — | `isFollowing` | `boolean` | `user.has_followed_bot` |
| 友だち登録／解除 | ボタン | — | — | — | `LineSubscriptionService` |
| LINE 連携 | LINE ログインフロー | — | — | — | `lineAuthService`, `Line.getProfile` |
| 顔一覧 | リンク | — | — | — | → `ListFace` |
| アカウント削除 | 破壊的操作 | — | — | — | 確認アラート |
| 戻る | ヘッダー | — | — | — | `goBack()` |

## 3. ナビゲーション

- **遷移先:** `ListFace`（`{ type: '' }`）。
- **戻る:** `goBack()`。

## 4. ロジック・API

- `LineSubscriptionService.isSignedIn`, `subscribeToOfficialAccount`。
- `authService.linkLineAccount(userId)`, `authService.updateProfile`, `authService.deleteUser`。
- `dispatch(checkAuthAsync())`, `setUser`, `logout`, `removeAuthData`, `setUserData`。
- `AsyncStorage`（`LINE_PROFILE_KEY`）。
