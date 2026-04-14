# Register

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `name` | `TextInput` | はい | `''` | `string` | `isName` |
| `email` | `TextInput` | はい | `''` | `string` | `isEmail` |
| `phone` | `TextInput` | はい | `''` | `string` | `isPhoneNumber` |
| `password` | `TextInput` | はい | `''` | `string` | `isPassword` |
| `confirm_password` | `TextInput` | はい | `''` | `string` | `isPasswordConfirm`（パスワードと一致） |
| `agency_code` | `TextInput` | いいえ（パススルー） | `''` | `string` | 空許可はバックエンド仕様次第 |
| アバター | `Image`／アップロード | `validateImage` により必須 | — | 選択画像 | サイズ・形式チェック |
| 規約同意 | `RadioButton.Android` | はい | `false` | `boolean` | 未チェック時は登録ボタン無効 |
| `ImagePickerModal` | モーダル | — | — | — | 撮影／ライブラリ |

## 3. ナビゲーション

- **スタック:** `Auth` → `Register`。
- **遷移先:** 成功アラートの OK、または「ログインはこちら」から `Login`。
- **登録完了後:** `dispatch(setAuthenticated())` で `App` へ。

## 4. ロジック・API

- **Android:** `axios.post` multipart で `API_BASE_URL` + `API_ENDPOINTS.AUTH.REGISTER`。
- **iOS 等:** `dispatch(registerAsync(registerData))` — `authSlice`。
- **成功後:** `disableBiometricLogin()`、`setAuthData`、`setUser`、`setTokens`、アラート後に任意で生体認証保存を促す。
