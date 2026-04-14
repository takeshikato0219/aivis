# ForgotPassword

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| Email | `TextInput` (custom) | Có | `''` | `string` | `isEmail` |
| Hoàn tất | `TouchableOpacity` | — | — | — | Gọi API forgot password |
| Login here | `TouchableOpacity` | — | — | — | Reset stack về `Login` |

## 3. Điều hướng

- **Từ:** `Login` → `ForgotPassword`.
- **Tới:** `navigation.reset` về `Login`; hoặc `goBack` sau `Alert` thành công từ API.

## 4. Logic & API

- `authService.forgotPassword(email)` — cần mạng (`useAppSetup`).
- Thành công: `Alert` với message từ server, OK → `goBack()`.
- Lỗi: `useErrorHandler`.
