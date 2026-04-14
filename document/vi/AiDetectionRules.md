# AiDetectionRules

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `camera` | Route | Có | — | `Camera` | |
| Danh sách rule AI | List | — | — | — | Mở lịch làm việc theo rule |
| Back | Header | — | — | — | |

## 3. Điều hướng

- **Params:** `AiDetectionRules`: `{ camera }`.
- **Tới:** `WorkSchedule` với `camera`, `ruleId`, `title`, `code`.
- **Ra:** `goBack()`.

## 4. Logic & API

- `cameraService.getRulesForCamera(camera.id)` — rules gắn camera.
