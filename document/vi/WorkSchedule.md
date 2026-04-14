# WorkSchedule

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `camera` | Route | Có | — | `Camera` | |
| `ruleId` | Route | Có | — | `string` | |
| `title`, `code` | Route | Có | — | `string` | Hiển thị & lưu |
| Lịch (ngày/giờ/khối) | Form + calendar | — | — | — | Theo UI file |
| `GroupedMemberPicker` | Sub-component | — | — | — | Chọn thành viên, search |

## 3. Điều hướng

- **Ra:** `goBack()` sau lưu (Alert).

## 4. Logic & API

- `cameraService.getWorkScheduleForRule(camera.id, ruleId)` — đọc lịch.
- `cameraService.updateWorkScheduleForRule(...)` — cập nhật.
- `faceService.getMembers`, `getMemberRelationships` — gán người vào lịch (pagination trong file).
