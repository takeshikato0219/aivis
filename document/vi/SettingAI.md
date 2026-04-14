# SettingAI

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `camera` | Route | Có | — | `Camera` | |
| `latestFirmwareUpdate` | Route | Không | — | object \| null | Thông tin bản firmware |
| Menu: vùng phát hiện / rule AI / firmware | Rows | — | — | — | Navigate tương ứng |
| Xóa camera | Destructive | — | — | — | Confirm |

## 3. Điều hướng

- **Tới:** `UploadDetectZone`, `AiDetectionRules`, `UpdateCamera`, `Home`.
- **Ra:** `goBack()`.

## 4. Logic & API

- `cameraService.getDetailCamera(camera.id)` — đồng bộ chi tiết.
- `cameraService.deleteCamera(camera.id)` — xóa thiết bị.
