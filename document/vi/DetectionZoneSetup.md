# DetectionZoneSetup

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `camera` | Route | Có | — | `Camera` | |
| `zoneType` | Route | Không | — | `'detection' \| 'restricted' \| 'entry_exit'` | |
| `typeId` | Route | Không | — | `string` | Loại zone |
| `liveUrl` | Route | Có | — | `string` | Stream WebView |
| WebView vẽ vùng | Canvas / JS bridge | — | — | — | `postMessage` frame / video check |
| Polygon / điểm zone | Gesture | — | — | — | Lưu payload zone |

## 3. Điều hướng

- **Ra:** `goBack()` sau lưu thành công (Alert OK).

## 4. Logic & API

- `cameraService.getLiveStreamUrl(camera.id)` — URL + refresh.
- `detectionZoneService.getZones(camera.id, typeId)` — tải zone hiện có.
- `detectionZoneService.createZone` / `updateZone` — lưu polygon / metadata.
- WebView injected JS: capture frame, kiểm tra video có dữ liệu.
