# 画面仕様（`document/ja/`）

ソースコード上の各画面（`src/screens/`）の UI／props、ナビゲーション、ロジック・API 呼び出しをまとめた仕様書です。ルートパラメータは `src/navigation/types.ts`（`AppStackParamList`, `AuthStackParamList`）を参照してください。

**ベトナム語版:** [`../vi/README.md`](../vi/README.md)

## 目次

### ルート・認証

| 画面 | 仕様ファイル |
|------|----------------|
| スプラッシュ | [SplashScreen.md](./SplashScreen.md) |
| ログイン | [Login.md](./Login.md) |
| 新規登録 | [Register.md](./Register.md) |
| パスワード忘れ | [ForgotPassword.md](./ForgotPassword.md) |
| 規約・ポリシー | [Policy.md](./Policy.md) |

### メインアプリ

| 画面 | 仕様ファイル |
|------|----------------|
| イントロ（オンボーディング） | [Introduce.md](./Introduce.md) |
| ホーム | [Home.md](./Home.md) |
| 通知 | [Notifications.md](./Notifications.md) |
| カメラ詳細／ルール | [Detail.md](./Detail.md) |
| ライブビュー | [CameraLiveView.md](./CameraLiveView.md) |
| QR スキャン | [QRScanner.md](./QRScanner.md) |
| カメラ設定（Wi‑Fi フォーム） | [CameraSetup.md](./CameraSetup.md) |
| セットアップ完了 | [SetupComplete.md](./SetupComplete.md) |
| プロフィール | [Profile.md](./Profile.md) |
| プロフィール編集 | [EditProfile.md](./EditProfile.md) |
| パスワード変更 | [ChangePassword.md](./ChangePassword.md) |
| 設定（LINE・アカウント） | [Setting.md](./Setting.md) |

### デバイス接続・ネットワーク（BLE / Wi‑Fi）

| 画面 | 仕様ファイル |
|------|----------------|
| デバイス接続（BLE スキャン） | [ConnectDevice.md](./ConnectDevice.md) |
| ペアリングコード | [PairingCode.md](./PairingCode.md) |
| カメラ Wi‑Fi ホットスポット | [ConnectWifiHotspot.md](./ConnectWifiHotspot.md) |
| ネットワーク設定（Wi‑Fi / LAN / LTE） | [NetworkSetup.md](./NetworkSetup.md) |
| 接続成功 | [ConnectionSuccessful.md](./ConnectionSuccessful.md) |

### 検知エリア・AI

| 画面 | 仕様ファイル |
|------|----------------|
| 検知エリア設定 | [DetectionZoneSetup.md](./DetectionZoneSetup.md) |
| アップロード／種別選択 | [UploadDetectZone.md](./UploadDetectZone.md) |
| AI カメラ設定 | [SettingAI.md](./SettingAI.md) |
| AI ルール・勤務スケジュール | [AiDetectionRules.md](./AiDetectionRules.md) |
| 勤務スケジュール（ルール単位） | [WorkSchedule.md](./WorkSchedule.md) |
| ファームウェア更新 | [UpdateCamera.md](./UpdateCamera.md) |

### 顔登録

| 画面 | 仕様ファイル |
|------|----------------|
| 顔アップロード | [FaceUpload.md](./FaceUpload.md) |
| メンバー一覧 | [ListFace.md](./ListFace.md) |
| メンバー詳細 | [DetailFace.md](./DetailFace.md) |

### レポート・カメラ別通知

| 画面 | 仕様ファイル |
|------|----------------|
| 種別ごとの通知一覧 | [ListNotificationCamera.md](./ListNotificationCamera.md) |
| 来客レポート | [CustomerReport.md](./CustomerReport.md) |

---

**備考:** `Search` は現状 `AppNavigator.tsx` に未登録です。上記以外の画面はアプリスタックのルートに対応します。
