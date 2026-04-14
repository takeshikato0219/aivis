# EditProfile

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| Các field hồ sơ | `TextInput` / form | Theo form | từ `user` | string | Validate qua `useInput` / rules trong file |
| Avatar | Image picker tương tự đăng ký | Tùy | — | — | |
| Lưu | Button | — | — | — | Gọi `authService.updateProfile` |
| Xóa tài khoản (nếu có) | — | — | — | — | Có thể dispatch logout |

## 3. Điều hướng

- **Params:** `EditProfile`: `undefined`.
- **Ra:** `goBack()` sau lưu thành công; có flow logout nếu xóa tài khoản.

## 4. Logic & API

- `authService.updateProfile(updateData)` — cập nhật server.
- `dispatch(setUser(updatedUser))`.
- Có thể `dispatch(logout())` khi xóa tài khoản (theo confirm trong màn).
