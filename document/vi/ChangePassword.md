# ChangePassword

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| Mật khẩu hiện tại | `TextInput` | Có | `''` | `string` | Theo validate trong màn |
| Mật khẩu mới / xác nhận | `TextInput` | Có | `''` | `string` | Khớp nhau, rule mật khẩu |
| Xác nhận | `Button` | — | — | — | Submit |

## 3. Điều hướng

- **Ra:** `goBack()` sau thành công; có thể logout nếu server yêu cầu đăng nhập lại.

## 4. Logic & API

- `authService.changePassword(...)` — tham số theo service.
- Thành công có thể `dispatch(logout())` và buộc đăng nhập lại (theo code màn).
