# Introduce

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| Logo | SVG | — | — | — | Kích thước tablet/phone |
| `FlatList` slides | Danh sách | — | `slides` (1 item) | `key`, `image` | Horizontal, paging, `scrollEnabled={false}` |
| Nút “về Home” | `TouchableOpacity` | — | — | — | `goToHome` |
| `ImageBackground` | Asset webp | — | — | — | Nền toàn màn |

## 3. Điều hướng

- **Stack:** `App` — thường là màn đầu sau đăng nhập (trước `Home` tùy flow).
- **Tới:** `navigation.navigate('Home')`.

## 4. Logic & API

- Không gọi API. Tính toán layout theo `onLayout`, `isLandscape`, `isTablet()` cho kích thước slide.
