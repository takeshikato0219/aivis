# UpdateCamera

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `camera` | Route (optional union) | Thường có | — | `Camera` | Có thể `undefined` theo type |
| `latestFirmwareUpdate` | Route | Không | — | object \| null | Mô tả phiên bản |
| Nút cập nhật firmware | Button | — | — | — | Gọi API update version |

## 3. Điều hướng

- **Từ:** `SettingAI` chủ yếu.
- **Ra:** `goBack()`.

## 4. Logic & API

- `cameraService.getDetailCamera(camera.id)` — refresh trạng thái.
- `cameraService.updateVersionCamera(camera.id)` — kích hoạt cập nhật OTA / version.
