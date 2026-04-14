# Home

## 1. Mục lục

1. [Mục lục](#1-mục-lục)
2. [Components](#2-components)
3. [Điều hướng](#3-điều-hướng)
4. [Logic & API](#4-logic--api)

## 2. Components

| Name | Loại | Bắt buộc | Mặc định | Kiểu dữ liệu | Validation / Ghi chú |
|------|------|----------|----------|--------------|---------------------|
| Tab workflow / “All” | UI tùy `activeIndex` | — | `0` | `number` | Lọc camera theo `facility_id` |
| Danh sách camera | Cards + `ScrollView` / load more | — | `[]` | `Camera[]` | Pagination `page`, `per_page: 20` |
| Drawer | `DrawerMenu` | — | `isDrawerOpen` | `boolean` | Sync user khi mở |
| Bell | Icon | — | — | — | Badge `unreadCount` |
| Thêm camera (Bluetooth) | CTA | — | — | — | → `ConnectDevice` |
| Avatar user | `Image` | — | từ Redux `user` | URL | Fallback khi lỗi load |

## 3. Điều hướng

- **Tới:** `Detail` (`camera`, `workflowStatuses`), `ConnectDevice`, `Notifications` (`userId` optional).
- **Không header** mặc định (`headerShown: false`).

## 4. Logic & API

- `cameraService.getWorkflowStatuses()` — tabs trạng thái cơ sở.
- `cameraService.getCameras({ sort_by, sort_order, page, per_page, facility_id })` — danh sách + load more.
- `cameraService.getDetailCamera(cam.id)` — (trong flow refresh) cập nhật firmware hint.
- `notificationsService.getNotifications({ is_seen: false, user_id })` — đếm chưa đọc.
- `appBadgeService.setBadgeCount` — đồng bộ icon app.
- Local: `AsyncStorage` / `RNFS` cho preview frame cuối (`camera_last_frame_*`).
- `useUserSync` khi mở drawer.
