# DetailFace

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `memberId` | ルート | はい | — | `string` | |
| `relationships` | ルート | いいえ | — | `MemberRelationship[]` | |
| マルチアングル画像 | グリッド／ビューア | — | — | — | 画像ごとに編集 |
| メンバー情報 | フォーム | — | — | — | 更新／顔画像削除 |

## 3. ナビゲーション

- **戻る:** 更新／削除成功後に `goBack()`。

## 4. ロジック・API

- `faceService.getMember(memberId)` — 詳細取得。
- `faceService.updateMember(member.id, formData)` — 更新。
- `faceService.deleteMemberFace(member.id)` — 登録顔削除。
- ローカルで `Image.getSize`、クロップ／リサイズ。
