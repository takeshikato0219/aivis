# Policy

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `route.params.type` | ルート | はい（正しい内容取得のため） | — | `'privacy' \| 'terms'` | タイトルは i18n で切替 |
| ヘッダー戻る | `TouchableOpacity` + SVG | — | — | — | `goBack()` |
| `RenderHTML` | ライブラリ | — | — | HTML 文字列 | `contentWidth` は `useWindowDimensions` |
| ローディング | `ActivityIndicator` + オーバーレイ | — | `loading` | `boolean` | ポリシー取得中 |

## 3. ナビゲーション

- **認証:** `Login` → `Policy`（`{ type }`）。
- **アプリ内:** `Profile` 等 → 同じコンポーネントで `Policy`（`{ type }`）。
- **戻る:** `goBack()`。

## 4. ロジック・API

- `policyService.getPolicies(policyType)` — `'privacy'` → `1`、それ以外（規約）→ `2`。
- `items[0].content` を HTML 表示。空のときは `t('home.noData')` を表示。
