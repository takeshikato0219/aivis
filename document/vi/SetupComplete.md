# SetupComplete

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `cameraName` | Route | Có | — | `string` | Hiển thị thông tin hoàn tất |
| `ssid` | Route | Có | — | `string` | |
| Animation | `Animated` | — | — | — | scale + fade icon |
| Về Dashboard | Button | — | — | — | → `Home` |
| Tiếp tục quét QR | Button | — | — | — | → `QRScanner` |

## 3. Điều hướng

- **Params:** `SetupComplete`: `{ cameraName, ssid }`.
- **Tới:** `Home`, `QRScanner`.

## 4. Logic & API

- Không gọi API; chỉ UI xác nhận sau `CameraSetup`.
