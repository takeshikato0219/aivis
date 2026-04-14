# Policy

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| `route.params.type` | Route | Có (để load đúng nội dung) | — | `'privacy' \| 'terms'` | Map title i18n |
| Header back | `TouchableOpacity` + SVG | — | — | — | `goBack()` |
| `RenderHTML` | Thư viện | — | — | HTML string | `contentWidth` từ `useWindowDimensions` |
| Loading | `ActivityIndicator` + overlay | — | `loading` state | `boolean` | Khi fetch policy |

## 3. Điều hướng

- **Auth:** `Login` → `Policy` với `{ type }`.
- **App:** `Profile` / màn khác → `Policy` với `{ type }` (cùng component).
- **Ra:** `goBack()`.

## 4. Logic & API

- `policyService.getPolicies(policyType)` — `type === 'privacy'` → `1`, ngược lại `2` (terms).
- Hiển thị `items[0].content` HTML; rỗng → text `t('home.noData')`.
