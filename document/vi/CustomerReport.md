# CustomerReport

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `title` | Route | Có | — | `string` | |
| `icon` | Route | Có | — | `string` | |
| `cameraId` | Route | Có | — | `string` | |
| `detected_at` | Route | Không | — | `string` | |
| Chọn ngày báo cáo | Date controls | — | `selectedDate` | `Date` | Đổi ngày ±1 |

## 3. Điều hướng

- **Từ:** `Detail`, `Notifications`.
- **Ra:** `goBack()`.

## 4. Logic & API

- `cameraService.reportCustomer(cameraId, { date: selectedDate })` — dữ liệu báo cáo khách theo ngày.
