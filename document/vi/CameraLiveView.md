# CameraLiveView

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `cameraId` | Route | Có | — | `string` | |
| `cameraName` | Route | Không | — | `string` | |
| `baseUrl` | Route | Không | — | `string` | Stream tùy chọn |
| WebView stream | `WebView` + HTML/JS | — | — | — | Capture frame, check video data |
| Điều khiển ghi hình | Buttons | — | — | — | Start/stop recording |
| Back | — | — | — | — | `goBack()` |

## 3. Điều hướng

- **Params:** `CameraLive`: `{ cameraId, cameraName?, baseUrl? }`.
- **Ra:** `goBack()`.

## 4. Logic & API

- `cameraService.getLiveStreamUrl(cameraId)` — URL + refresh token timing.
- `recordingService.startRecording` / `stopRecording` / `saveToGallery` / `cleanSandbox` / `getRecordingDuration`.
- Lưu frame cuối (AsyncStorage / file) phục vụ thumbnail trên Home/Detail.
