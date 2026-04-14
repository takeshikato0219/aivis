# CameraSetup

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `qrData` | Route | Có (nullable) | `null` | `string \| null` | Từ QRScanner |
| `ssid` | RN `TextInput` / state | Ghi nhận | `AIVIS_Home_5G` | `string` | Wi-Fi camera kết nối |
| `password` | TextInput | Tùy mạng | `''` | `string` | Toggle hiển thị |
| `cameraName` | TextInput | Có cho bước tiếp | ví dụ 例 | `string` | |
| `selectedLocation` | Chọn từ `LOCATIONS` | — | `リビング` | `string` | |
| `selectedScene` | `SCENES` | — | `aivis1` | `string` | |
| Lưu & tiếp | Button | — | — | — | → `SetupComplete` |

## 3. Điều hướng

- **Params:** `CameraSetup`: `{ qrData: string | null }`.
- **Tới:** `SetupComplete` với `{ cameraName, ssid }`.
- **Ra:** `goBack()`.

## 4. Logic & API

- Màn hình form cấu hình Wi‑Fi/tên camera; **không** gọi REST trực tiếp trong file (chuẩn bị dữ liệu cho bước sau / QR flow).
