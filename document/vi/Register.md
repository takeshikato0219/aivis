# Register

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `name` | `TextInput` | Có | `''` | `string` | `isName` |
| `email` | `TextInput` | Có | `''` | `string` | `isEmail` |
| `phone` | `TextInput` | Có | `''` | `string` | `isPhoneNumber` |
| `password` | `TextInput` | Có | `''` | `string` | `isPassword` |
| `confirm_password` | `TextInput` | Có | `''` | `string` | `isPasswordConfirm` khớp password |
| `agency_code` | `TextInput` | Không (validate pass-through) | `''` | `string` | Cho phép rỗng tùy rule backend |
| Avatar | `Image` / upload | Có (theo `validateImage`) | — | Ảnh đã chọn | `validateImage(selectedImage)` — bắt buộc + kích thước/loại |
| Đồng ý điều khoản | `RadioButton.Android` | Có | `false` | `boolean` | Nút đăng ký disabled nếu chưa tick |
| `ImagePickerModal` | Modal | — | — | — | Chụp / thư viện |

## 3. Điều hướng

- **Stack:** `Auth` → `Register`.
- **Tới:** `Login` (sau khi user bấm OK trên alert thành công, hoặc link “login here”).
- **Sau đăng ký:** `dispatch(setAuthenticated())` — chuyển sang `App`.

## 4. Logic & API

- **Android:** `axios.post` multipart tới `API_BASE_URL` + `API_ENDPOINTS.AUTH.REGISTER`.
- **iOS / khác:** `dispatch(registerAsync(registerData))` — `authSlice`.
- **Sau thành công:** `disableBiometricLogin()`, `setAuthData`, `setUser`, `setTokens`, Alert → optional prompt bật sinh trắc học.
