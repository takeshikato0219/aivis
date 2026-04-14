# NetworkSetup

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `cameraAp` | Route | Có | — | `string` | Tên AP / camera |
| Tab Wi‑Fi / LAN / LTE | `TABS` | — | `wifi` | union | Icon + title |
| Danh sách Wi‑Fi (BLE) | List + signal | — | — | — | `wifiNetworks`, `wifiScanStatus` |
| Mật khẩu Wi‑Fi | `TextInput` | Khi nối Wi‑Fi | — | `string` | `isPasswordWifi` |
| Trạng thái liên kết | Indicator | — | — | — | Ethernet / LTE polling |
| Tiến trình kết nối | Progress / loading | — | — | — | `connecting`, `connectingNetSetup` |

## 3. Điều hướng

- **Params:** `NetworkSetup`: `{ cameraAp: string }`.
- **Ra:** `goBack()` / hoàn tất flow BLE (tùy implementation phía dưới file).

## 4. Logic & API

- **BLE (Jetson):** `useJetsonBLE` — `requestWiFiScan`, `sendWiFiCredentials`, `checkNetworkStatus`, `netSetupConnect`.
- **Service:** `jetsonBLEService` — disconnect, kiểu `NetCheckType`.
- **Redux:** `store.getState().ble` — `networkStatus`, Wi‑Fi status.
- Không dùng REST HTTP trực tiếp cho cấu hình mạng thiết bị (kênh BLE).
