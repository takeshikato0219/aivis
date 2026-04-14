# ConnectDevice

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `RadarScan` | Sub-component | — | — | — | Animation + dots theo số thiết bị |
| Danh sách thiết bị BLE | `FlatList` / cards | — | `devices` | `SerializableDevice[]` | Từ `useJetsonBLE` |
| Quét lại / mở Bluetooth | Buttons | — | — | — | `BleManager`, `Alert` nếu tắt BT |
| Header back | — | — | — | — | → `Home` |

## 3. Điều hướng

- **Từ:** `Home` (thêm camera).
- **Tới:** `PairingCode` với `{ device, pairingCode: '' }`.
- **Không dùng** `ConnectWifiHotspot` trực tiếp từ đây trong code đã đọc.

## 4. Logic & API

- **BLE:** `useJetsonBLE` — `startScan`, `stopScan`, danh sách `devices`.
- **Không REST** trên màn này; kết nối tiếp qua `PairingCode` / `jetsonBLEService`.
