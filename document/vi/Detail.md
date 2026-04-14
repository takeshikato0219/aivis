# Detail

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `camera` | Route param | Có | — | `Camera` | Tên, facility, id |
| `workflowStatuses` | Route param | Có | — | `WorkflowStatus[]` | Xác định workflow Store / Enterprise / Family |
| Chế độ (modes) | State + UI grid | — | — | `any[]` từ API | Chọn mode camera |
| Rules / icons | Theo `RULE_CONFIGS_BY_WORKFLOW` | — | — | — | Điều hướng con khác nhau |
| Live camera row | Touchable | — | — | — | → `CameraLive` |
| Counter detection | Text | — | — | — | `countDetectionData`, live person |

## 3. Điều hướng

- **Tới:** `CameraLive`, `ListNotificationCamera`, `CustomerReport`, `ListFace`, `SettingAI` (kèm `camera`, `latestFirmwareUpdate`), `UploadDetectZone` / zone (tùy handler).
- **Restricted zone:** → `ListNotificationCamera` với code `restricted_area_intrusion`.
- **Ra:** `goBack()`.

## 4. Logic & API

- `rulesService.getRules({ facility_id: camera.facility_id })`.
- `cameraService.getCameraModes()`, `cameraService.countDetections(camera.id)`, `cameraService.getDetailCamera(camera.id)`.
- `cameraService.updateCamera(camera.id, modeId)` — đổi chế độ.
- `faceService.getMembers()` — đếm / điều kiện face list.
- `subscribeCountDetectionEvent` / `applyCountIncrements` — real-time counter (service).
- Local frame: `AsyncStorage` + `RNFS` cho thumbnail last frame.
