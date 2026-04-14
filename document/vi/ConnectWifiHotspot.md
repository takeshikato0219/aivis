# ConnectWifiHotspot

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `wifi` | Route | Có (object) | `{ ssid: 'AIVIS_AP_XXXX' }` | `any` | SSID hotspot camera |
| Password hotspot | `TextInput` (custom) | Tùy validate khi bấm | `''` | `string` | `isPasswordWifi` qua `useInput` (có validate nhưng `handleConnect` hiện chỉ navigate) |
| Kết nối | Button | — | — | — | → `NetworkSetup` |

## 3. Điều hướng

- **Params:** `ConnectWifiHotspot`: `{ wifi: any }`.
- **Tới:** `NetworkSetup` với `{ cameraAp: wifi.ssid }`.
- **Ra:** `goBack()`.

## 4. Logic & API

- Chủ yếu chuyển tiếp SSID sang `NetworkSetup`; không gọi REST trực tiếp trên màn này.
