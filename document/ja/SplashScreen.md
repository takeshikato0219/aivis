# SplashScreen

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `onFinish` | コールバック prop | はい | — | `() => void` | 認証復元後、約 1.5 秒遅延して呼び出し |
| Logo（`@assets/svg/logo.svg`） | SVG | — | — | SVG コンポーネント | `useResponsive` によりタブレット／スマホでサイズ変更 |
| `View` コンテナ | レイアウト | — | — | RN `View` | スプラッシュ背景 |

ユーザー向けフォーム・バリデーションなし。

## 3. ナビゲーション

- **表示:** `showSplash === true` のとき `RootNavigator` が直接描画（`NavigationContainer` より前）。
- **終了:** `onFinish()` → スプラッシュ非表示後、`isAuthenticated` に応じて `Auth` または `App` をマウント。
- **ルートパラメータ:** 本画面では React Navigation を使用しない。

## 4. ロジック・API

- `useEffect` 内で `dispatch(checkAuthAsync()).unwrap()` — ストレージ／トークンからセッション復元（Redux `authSlice`）。
- `finally` で `setTimeout(..., 1500)` の後 `onFinish()` — ロゴ表示を最低約 1.5 秒確保。
- `checkAuthAsync` 失敗時は catch が空だが、アプリは未ログイン扱いでログインフローへ進む。
