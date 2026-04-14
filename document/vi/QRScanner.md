# QRScanner

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| Camera permission | Vision Camera API | Có (OS) | — | — | Prompt / settings |
| Vùng quét QR | Camera view | — | — | — | `scanningEnabled`, `isSearching` |
| Nút thủ công | — | — | — | — | → `CameraSetup` với `qrData: null` khi không quét được |
| Trạng thái tìm BLE / pairing | ActivityIndicator | — | — | — | Sau khi có QR |

## 3. Điều hướng

- **Tới:** `CameraSetup` (`qrData`), `ConnectionSuccessful` (sau đăng ký camera thành công).
- **Ra:** `goBack()`.

## 4. Logic & API

- `cameraService.registerCamera(...)` — đăng ký thiết bị sau khi có dữ liệu quét / flow BLE.
- `cameraService.updateStatus()` — cập nhật trạng thái.
- `jetsonBLEService.disconnect()` — ngắt BLE khi chuyển màn.
- Quản lý quyền camera: `Camera.getCameraPermissionStatus()` v.v.
