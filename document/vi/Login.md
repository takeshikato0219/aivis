# Login

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| Email / ID | `TextInput` (custom) | Có khi đăng nhập thủ công | `''` | `string` | `isEmail` qua `useInput` |
| Password | `TextInput` (custom) | Có khi đăng nhập thủ công | `''` | `string` | `isPassword` |
| Nút đăng nhập | `Button` | — | — | — | Disabled khi `isLoading` |
| `BiometricButton` | Component | — | — | — | Sinh trắc học khi đã bật |
| Google / LINE / Apple | `TouchableOpacity` | — | — | — | Apple chỉ iOS |
| Terms / Privacy links | `TouchableOpacity` + `Text` | — | — | — | Gọi `Policy` với `type` |

## 3. Điều hướng

- **Stack:** `Auth` → màn `Login` (initial).
- **Đi tới:** `Register`, `ForgotPassword`, `Policy` (`type`: `'terms'` \| `'privacy'`).
- **Sau đăng nhập thành công:** Root đổi sang `App` (không navigate từ Login; Redux `isAuthenticated`).

## 4. Logic & API

- **Email/password:** `dispatch(loginAsync({ email, password }))` — `authSlice`.
- **Google:** `googleAuthService.signIn()` → `socialLoginAsync({ id_token })`.
- **Apple:** `appleAuthService.signIn()` → `socialAppleLoginAsync`; có thể `authService.updateProfile` tên.
- **LINE:** `lineAuthService.signIn()` → `socialLineLoginAsync`; `Line.getProfile()` → `authService.linkLineAccount`.
- **Sinh trắc học:** `verifyTokenAsync` với token Keychain; `setAuthData`; prompt bật lưu credential.
- **Hooks:** `useAppSetup` (mạng), `useBiometric`, `useErrorHandler`, `useInput`.
