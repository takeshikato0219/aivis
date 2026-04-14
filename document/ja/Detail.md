# Detail

## 1. 目次

1. [目次](#1-目次)
2. [コンポーネント](#2-コンポーネント)
3. [ナビゲーション](#3-ナビゲーション)
4. [ロジック・API](#4-ロジックapi)

## 2. コンポーネント

| 名前 | 種類 | 必須 | デフォルト | 型 | バリデーション・備考 |
|------|------|------|------------|-----|----------------------|
| `camera` | ルート | はい | — | `Camera` | 名称、facility、id |
| `workflowStatuses` | ルート | はい | — | `WorkflowStatus[]` | Store／Enterprise／Family 等の判定 |
| モード | 状態 + グリッド UI | — | — | API の `any[]` | カメラモード選択 |
| ルール／アイコン | `RULE_CONFIGS_BY_WORKFLOW` 準拠 | — | — | — | 子画面への遷移が異なる |
| ライブ行 | Touchable | — | — | — | → `CameraLive` |
| 検知カウンタ | テキスト | — | — | — | `countDetectionData`、ライブ人数 |

## 3. ナビゲーション

- **遷移先:** `CameraLive`、`ListNotificationCamera`、`CustomerReport`、`ListFace`、`SettingAI`（`camera`, `latestFirmwareUpdate`）、ハンドラにより `UploadDetectZone` 等。
- **立入禁止エリア:** コード `restricted_area_intrusion` で `ListNotificationCamera`。
- **戻る:** `goBack()`。

## 4. ロジック・API

- `rulesService.getRules({ facility_id: camera.facility_id })`。
- `cameraService.getCameraModes()`、`cameraService.countDetections(camera.id)`、`cameraService.getDetailCamera(camera.id)`。
- `cameraService.updateCamera(camera.id, modeId)` — モード変更。
- `faceService.getMembers()` — 顔一覧条件・件数。
- `subscribeCountDetectionEvent`／`applyCountIncrements` — リアルタイムカウンタ（サービス）。
- サムネ用に `AsyncStorage` + `RNFS` で最終フレームを保持。
