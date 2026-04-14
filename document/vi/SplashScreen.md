# SplashScreen

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `onFinish` | Callback prop | Có | — | `() => void` | Gọi sau khi khôi phục auth + delay ~1.5s |
| Logo (`@assets/svg/logo.svg`) | SVG | — | — | Component SVG | Kích thước theo `useResponsive` (tablet vs phone) |
| `View` container | Layout | — | — | RN `View` | Nền splash |

Không có form hay validation người dùng.

## 3. Điều hướng

- **Vào màn:** Được render trực tiếp từ `RootNavigator` khi `showSplash === true` (trước `NavigationContainer`).
- **Ra màn:** `onFinish()` → ẩn splash, mount `NavigationContainer` với `Auth` hoặc `App` theo `isAuthenticated`.
- **Route params:** Không dùng React Navigation cho màn này.

## 4. Logic & API

- `useEffect`: `dispatch(checkAuthAsync()).unwrap()` — khôi phục phiên từ storage/token (Redux `authSlice`).
- `finally`: `setTimeout(..., 1500)` rồi `onFinish()` — hiển thị logo tối thiểu ~1.5s.
- Lỗi khi `checkAuthAsync` bị bỏ qua (catch rỗng); app vẫn vào flow đăng nhập nếu không có token hợp lệ.
