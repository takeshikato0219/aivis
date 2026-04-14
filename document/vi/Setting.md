# Setting

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| Trạng thái follow LINE OA | Row + loading | — | `isFollowing` | `boolean` | `user.has_followed_bot` |
| Đăng ký / hủy OA | Buttons | — | — | — | `LineSubscriptionService` |
| Liên kết LINE | Flow login LINE | — | — | — | `lineAuthService`, `Line.getProfile` |
| Danh sách khuôn mặt | Link | — | — | — | → `ListFace` |
| Xóa tài khoản | Destructive | — | — | — | Confirm Alert |
| Back | Header | — | — | — | `goBack()` |

## 3. Điều hướng

- **Tới:** `ListFace` (`{ type: '' }`).
- **Ra:** `goBack()`.

## 4. Logic & API

- `LineSubscriptionService.isSignedIn`, `subscribeToOfficialAccount`.
- `authService.linkLineAccount(userId)`, `authService.updateProfile`, `authService.deleteUser`.
- `dispatch(checkAuthAsync())`, `setUser`, `logout`, `removeAuthData`, `setUserData`.
- `AsyncStorage` (`LINE_PROFILE_KEY`).
