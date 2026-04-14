# ListNotificationCamera

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `title` | Route | Có | — | `string` | Tiêu đề header |
| `icon` | Route | Có | — | `string` | Tên icon map |
| `code` | Route | Có | — | `string` | Mã rule / loại thông báo |
| `cameraId` | Route | Có | — | `string` | |
| `detected_at` | Route | Không | — | `string` | Lọc theo ngày nếu có |
| Chọn ngày | Date navigation | — | — | — | Prev/next ngày trong file |

## 3. Điều hướng

- **Từ:** `Detail`, `Notifications`, v.v.
- **Ra:** `goBack()`.

## 4. Logic & API

- `notificationsService.getNotificationWithType(...)` — danh sách theo camera + type/code + ngày.
