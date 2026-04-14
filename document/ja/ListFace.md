# ListFace

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `type` | ルート | はい | — | `string` | `FaceUpload` に引き渡し |
| メンバー一覧 | リスト + 無限スクロール | — | — | Members | `MEMBERS_PER_PAGE` |
| 顔を追加 | FAB／行 | — | — | — | → `FaceUpload` |
| メンバー詳細 | 行 | — | — | — | → `DetailFace` |

## 3. ナビゲーション

- **遷移先:** `FaceUpload({ type })`, `DetailFace({ memberId, relationships })`。
- **戻る:** `goBack()`。

## 4. ロジック・API

- `faceService.getMembers({ page, per_page })` — ページング。
- `faceService.getMemberRelationships()` — 表示マッピング／詳細へ引き渡し。
