# FaceUpload

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `type` | Route | Có | — | `string` | Ngữ cảnh upload (theo flow) |
| Ảnh khuôn mặt theo vị trí | Camera / gallery / multi | Có (theo flow) | — | Image[] | `Image.getSize`, crop |
| Quan hệ thành viên | Picker | Tùy | — | — | `faceService.getMemberRelationships` |
| Nút lưu / hủy | — | — | — | — | Confirm thoát |

## 3. Điều hướng

- **Params:** `FaceUpload`: `{ type: string }`.
- **Ra:** `goBack()` sau upload thành công hoặc confirm.

## 4. Logic & API

- `faceService.getMemberRelationships()`.
- `faceService.uploadFaces(formData)` — multipart, có thể gọi nhiều lần theo batch trong file.
- Xử lý ảnh local trước khi gửi (resize, validate).
