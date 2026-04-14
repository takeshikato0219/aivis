# Login

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| メール／ID | カスタム `TextInput` | 手動ログイン時 | `''` | `string` | `useInput` + `isEmail` |
| パスワード | カスタム `TextInput` | 手動ログイン時 | `''` | `string` | `isPassword` |
| ログインボタン | `Button` | — | — | — | `isLoading` 中は無効 |
| `BiometricButton` | コンポーネント | — | — | — | 生体認証が有効な場合 |
| Google／LINE／Apple | `TouchableOpacity` | — | — | — | Apple は iOS のみ |
| 利用規約／プライバシー | `TouchableOpacity` + `Text` | — | — | — | `Policy` へ `type` を渡して遷移 |

## 3. ナビゲーション

- **スタック:** `Auth` — 初期画面は `Login`。
- **遷移先:** `Register`, `ForgotPassword`, `Policy`（`type`: `'terms'` \| `'privacy'`）。
- **ログイン成功後:** ルートが `App` に切り替わる（Login からの navigate ではなく Redux `isAuthenticated`）。

## 4. ロジック・API

- **メール／パスワード:** `dispatch(loginAsync({ email, password }))` — `authSlice`。
- **Google:** `googleAuthService.signIn()` → `socialLoginAsync({ id_token })`。
- **Apple:** `appleAuthService.signIn()` → `socialAppleLoginAsync`；必要に応じ `authService.updateProfile` で氏名更新。
- **LINE:** `lineAuthService.signIn()` → `socialLineLoginAsync`；`Line.getProfile()` → `authService.linkLineAccount`。
- **生体認証:** Keychain のトークンで `verifyTokenAsync`；`setAuthData`；クレデンシャル保存のプロンプト。
- **フック:** `useAppSetup`（ネットワーク）、`useBiometric`、`useErrorHandler`、`useInput`。
