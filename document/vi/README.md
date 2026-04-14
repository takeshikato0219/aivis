# Tài liệu spec màn hình (`document/vi/`)

Tài liệu mô tả từng màn hình theo codebase hiện tại (mã nguồn màn hình: `src/screens/`): thành phần UI/props, điều hướng, logic và gọi API. Tham số route chuẩn xem `src/navigation/types.ts` (`AppStackParamList`, `AuthStackParamList`).

**Bản tiếng Nhật:** [`../ja/README.md`](../ja/README.md)

## Mục lục

### Luồng gốc & xác thực

| Màn hình | File spec |
|----------|-----------|
| Splash | [SplashScreen.md](./SplashScreen.md) |
| Đăng nhập | [Login.md](./Login.md) |
| Đăng ký | [Register.md](./Register.md) |
| Quên mật khẩu | [ForgotPassword.md](./ForgotPassword.md) |
| Điều khoản / Chính sách | [Policy.md](./Policy.md) |

### Ứng dụng chính

| Màn hình | File spec |
|----------|-----------|
| Giới thiệu (onboarding) | [Introduce.md](./Introduce.md) |
| Trang chủ | [Home.md](./Home.md) |
| Thông báo | [Notifications.md](./Notifications.md) |
| Chi tiết camera / rule | [Detail.md](./Detail.md) |
| Xem live camera | [CameraLiveView.md](./CameraLiveView.md) |
| Quét QR | [QRScanner.md](./QRScanner.md) |
| Cài đặt camera (form Wi‑Fi) | [CameraSetup.md](./CameraSetup.md) |
| Hoàn tất cài đặt | [SetupComplete.md](./SetupComplete.md) |
| Hồ sơ | [Profile.md](./Profile.md) |
| Sửa hồ sơ | [EditProfile.md](./EditProfile.md) |
| Đổi mật khẩu | [ChangePassword.md](./ChangePassword.md) |
| Cài đặt (LINE, tài khoản) | [Setting.md](./Setting.md) |

### Kết nối thiết bị & mạng (BLE / Wi‑Fi)

| Màn hình | File spec |
|----------|-----------|
| Kết nối thiết bị (quét BLE) | [ConnectDevice.md](./ConnectDevice.md) |
| Mã ghép đôi | [PairingCode.md](./PairingCode.md) |
| Thiết lập mạng (Wi‑Fi / LAN / LTE) | [NetworkSetup.md](./NetworkSetup.md) |
| Kết nối thành công | [ConnectionSuccessful.md](./ConnectionSuccessful.md) |

### Vùng phát hiện & AI

| Màn hình | File spec |
|----------|-----------|
| Thiết lập vùng phát hiện | [DetectionZoneSetup.md](./DetectionZoneSetup.md) |
| Tải / chọn loại vùng | [UploadDetectZone.md](./UploadDetectZone.md) |
| Cài đặt AI camera | [SettingAI.md](./SettingAI.md) |
| Quy tắc AI & lịch làm việc | [AiDetectionRules.md](./AiDetectionRules.md) |
| Lịch làm việc (rule) | [WorkSchedule.md](./WorkSchedule.md) |
| Cập nhật firmware camera | [UpdateCamera.md](./UpdateCamera.md) |

### Khuôn mặt

| Màn hình | File spec |
|----------|-----------|
| Upload khuôn mặt | [FaceUpload.md](./FaceUpload.md) |
| Danh sách thành viên | [ListFace.md](./ListFace.md) |
| Chi tiết thành viên | [DetailFace.md](./DetailFace.md) |

### Báo cáo & thông báo theo camera

| Màn hình | File spec |
|----------|-----------|
| Danh sách thông báo theo loại | [ListNotificationCamera.md](./ListNotificationCamera.md) |
| Báo cáo khách | [CustomerReport.md](./CustomerReport.md) |

---
