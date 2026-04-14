# ListFace

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `type` | Route | Có | — | `string` | Truyền sang `FaceUpload` |
| Danh sách thành viên | List + infinite scroll | — | — | Members | `MEMBERS_PER_PAGE` |
| Thêm khuôn mặt | FAB / row | — | — | — | → `FaceUpload` |
| Chi tiết thành viên | Row | — | — | — | → `DetailFace` |

## 3. Điều hướng

- **Tới:** `FaceUpload({ type })`, `DetailFace({ memberId, relationships })`.
- **Ra:** `goBack()`.

## 4. Logic & API

- `faceService.getMembers({ page, per_page })` — phân trang.
- `faceService.getMemberRelationships()` — map quan hệ hiển thị / truyền detail.
