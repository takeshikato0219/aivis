# DetailFace

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `memberId` | Route | Có | — | `string` | |
| `relationships` | Route | Không | — | `MemberRelationship[]` | |
| Ảnh multi-angle | Grid / viewer | — | — | — | Chỉnh sửa từng ảnh |
| Thông tin thành viên | Form | — | — | — | Cập nhật / xóa ảnh |

## 3. Điều hướng

- **Ra:** `goBack()` sau cập nhật / xóa thành công.

## 4. Logic & API

- `faceService.getMember(memberId)` — tải chi tiết.
- `faceService.updateMember(member.id, formData)` — cập nhật.
- `faceService.deleteMemberFace(member.id)` — xóa ảnh đăng ký.
- `Image.getSize` và xử lý crop/resize local.
