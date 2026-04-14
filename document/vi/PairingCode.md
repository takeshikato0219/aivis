# PairingCode

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `device` | Route | Khuyến nghị | — | BLE device serializable | id, name, localName... |
| `pairingCode` | Route | Không | `''` | `string` | Prefill ô nhập |
| `isWifi` | Route | Không | — | `boolean` | Nhánh flow |
| 6 ô mã PIN | `TextInput` | Có (đủ 6 ký tự) | — | `string` | Chỉ A–Z, 0–9; auto focus ô kế |
| Submit | — | — | — | — | `connect(device, code)` |

## 3. Điều hướng

- **Tới:** `NetworkSetup` với `{ cameraAp: device name }` khi ghép đôi thành công.
- **Ra:** `goBack()` (disconnect BLE trước).

## 4. Logic & API

- `useJetsonBLE().connect(device, code)` — BLE.
- `jetsonBLEService.disconnect()` khi back.
- Lỗi: `INVALID_PIN` → message i18n; khác → connection failed.
