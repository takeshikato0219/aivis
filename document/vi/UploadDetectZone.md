# UploadDetectZone

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `camera` | Route | Có | — | `Camera` | |
| Chọn loại vùng | List / picker | — | — | — | Từ `detectionZoneService.getType()` |
| Stream | WebView / preview | — | — | — | URL từ API |

## 3. Điều hướng

- **Params:** `UploadDetectZone`: `{ camera }`.
- **Tới:** `DetectionZoneSetup` (push với `zoneType`, `typeId`, `liveUrl`).

## 4. Logic & API

- `cameraService.getLiveStreamUrl(camera.id)`.
- `detectionZoneService.getType()` — danh mục loại vùng.
