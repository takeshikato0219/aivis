# ConnectionSuccessful

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `cameraData` | Route | Có | — | `Camera` | Đăng ký / đặt tên camera |
| Preview stream | WebView / video | — | — | — | Refresh URL theo TTL |
| CTA Home / Face | Buttons | — | — | — | Xem `Detail`/`ListFace` trong file |

## 3. Điều hướng

- **Params:** `ConnectionSuccessful`: `{ cameraData: Camera }`.
- **Tới:** `Home`, `ListFace` (`{ type: '' }`).

## 4. Logic & API

- `cameraService.getLiveStreamUrl(cameraData.id)` — lấy URL live, schedule refresh trước hết hạn token.
- `cameraService.registerCamera({...})` — hoàn tất đăng ký thiết bị (payload theo flow QR/BLE).
