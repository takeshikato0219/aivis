# Profile

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| Avatar / tên user | `Image`, `Text` | — | Redux `user` | User | |
| Sửa hồ sơ | Row | — | — | — | → `EditProfile` |
| Đổi mật khẩu | Row | — | — | — | → `ChangePassword` |
| Điều khoản / Privacy | Links | — | — | — | → `Policy` với `type` |
| Đăng xuất | Button | — | — | — | Xóa storage + Redux |

## 3. Điều hướng

- **Tới:** `EditProfile`, `ChangePassword`, `Policy`.
- **Ra:** `goBack()` (thường từ drawer / Home).

## 4. Logic & API

- `removeAuthData()`, `dispatch(logout())`, `appBadgeService.setBadgeCount(0)`.
- Không gọi API chỉ để hiển thị; dữ liệu user từ Redux.
