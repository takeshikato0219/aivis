# Notifications

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| Danh sách thông báo | Flat list / section | — | — | Notification items | Theo rule + loại |
| Filter / rule (nếu có) | Phụ thuộc `rulesService` | — | — | — | Map mã → icon, title |
| Nút back | Header | — | — | — | `goBack()` |

## 3. Điều hướng

- **Params:** `Notifications`: `{ userId?: string }`.
- **Tới:** `CustomerReport`, `ListNotificationCamera` (khi tap item tùy loại).
- **Ra:** `goBack()`.

## 4. Logic & API

- `rulesService.getRules()` — metadata filter.
- `notificationsService.getNotifications(...)` — lấy danh sách.
- `notificationsService.updateNotificationSeen(id, true)` — đánh dấu đã đọc.
- `appBadgeService.getBadgeCount` / `setBadgeCount` — cập nhật badge.
