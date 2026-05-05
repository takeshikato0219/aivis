# React Native ベースプロジェクト

TypeScript、Redux Toolkit、Axios、堅牢なエラーハンドリング、ユニットテスト、および SonarQube 連携の GitLab CI/CD を備えた、本番運用を想定した React Native のボイラープレートです。

---

## 📋 目次

- [概要](#概要)
- [主な機能](#主な機能)
- [技術スタックと依存パッケージのバージョン](#技術スタックと依存パッケージのバージョン)
- [プロジェクト構成](#プロジェクト構成)
- [はじめに](#はじめに)
- [開発とテスト](#開発とテスト)
- [API と環境変数](#api-と環境変数)
- [CI/CD とコード品質](#cicd-とコード品質)
- [使い方とベストプラクティス](#使い方とベストプラクティス)
- [ライセンス](#ライセンス)

> 英語版は [README.md](./README.md) を参照してください。

---

## 🎯 概要

このテンプレートは、ベストプラクティスとモジュール化されたアーキテクチャ、自動コード品質チェックを組み合わせ、SonarQube 解析付きの CI/CD にそのまま載せられる形でモバイルアプリ開発を始められるようにします。

- **厳格な TypeScript:** スタック全体で型安全性を担保します。
- **テスト重視:** 高いカバレッジを目指したユニット・統合テスト。
- **高度な CI/CD:** コード品質ゲート付きの GitLab CI パイプライン。
- **スケーラブルな構成:** 標準的で拡張しやすいディレクトリ構造。
- **開発者体験:** わかりやすいドキュメント、再利用可能なモジュール、高速な開発サイクル。

---

## ✨ 主な機能

### コア機能
- ✅ TypeScript 5.8.3 と Strict モード
- ✅ Redux Toolkit 2.11.0 と Redux Persist
- ✅ Axios 1.13.2 — グローバルインターセプターとエラーハンドリング
- ✅ コンポーネントスタイルを `.styles.ts` として分離
- ✅ API エンドポイントと定数の一元管理
- ✅ React Navigation 7.x: スタック、タブ、ドロワー
- ✅ React Native Paper 5.14.5 による Material Design

### エラーハンドリング
- ✅ グローバルエラーバウンダリ（React）
- ✅ クラッシュレポーター（デバイス情報のログ）
- ✅ ネットワークモニタ（オンライン／オフライン検知、オフライン用バナー）
- ✅ 復旧・監視用のカスタムフック

### 品質とテスト
- ✅ ESLint 8.19.0、Prettier 3.7.4、Husky 9.1.7、lint-staged 16.2.7
- ✅ TypeScript による静的解析
- ✅ Jest 29.6.3 と @testing-library/react-native 13.3.3
- ✅ 高いカバレッジ要件
- ✅ SonarQube スキャンと品質ゲートの適用

### CI/CD と生産性
- ✅ GitLab CI 連携
- ✅ プル／マージ時の自動テストと SonarQube 解析
- ✅ Fast Refresh と Hot Reload
- ✅ babel-plugin-module-resolver による import のパスエイリアス
- ✅ `.env` で API 設定を切り替え可能

### UX / UI
- ✅ レイアウトと向きに対応したレスポンシブデザイン
- ✅ テーマシステム（色、フォント、余白）
- ✅ オフライン用バナー、ローディング表示コンポーネント

### 国際化（i18n）
- ✅ i18next 25.7.2、react-i18next 16.4.1、react-native-localize 3.6.0
- ✅ 英語・日本語の翻訳を同梱

---

## 🛠 技術スタックと依存パッケージのバージョン

| 区分                     | パッケージ                                       | バージョン | 説明                             |
|--------------------------|--------------------------------------------------|------------|----------------------------------|
| **コア**                 | react-native                                     | 0.82.1     | モバイルフレームワーク           |
|                          | react                                            | 19.1.1     | UI ライブラリ                    |
|                          | typescript                                       | 5.8.3      | 型安全な開発                     |
| **ナビゲーション**       | @react-navigation/native                         | 7.1.24     | ナビゲーションの中核             |
|                          | @react-navigation/stack                          | 7.6.11     | スタックナビゲーション           |
|                          | @react-navigation/bottom-tabs                    | 7.8.11     | タブナビゲーション               |
|                          | @react-navigation/drawer                         | 7.7.8      | ドロワーナビゲーション           |
|                          | react-native-screens                             | 4.18.0     | 画面の最適化                     |
|                          | react-native-safe-area-context                   | 5.6.2      | セーフエリア                     |
|                          | react-native-gesture-handler                     | 2.29.1     | ジェスチャー管理                 |
| **状態管理**             | @reduxjs/toolkit                                 | 2.11.0     | 状態管理                         |
|                          | react-redux                                      | 9.2.0      | Redux の React バインディング    |
|                          | redux-persist                                    | *          | Redux ストアの永続化             |
| **UI コンポーネント**    | react-native-paper                               | 5.14.5     | Material Design 系 UI            |
|                          | react-native-vector-icons                        | 10.3.0     | アイコンセット                   |
| **ネットワーク・保存**   | axios                                            | 1.13.2     | HTTP クライアント                |
|                          | @react-native-community/netinfo                  | 11.4.1     | ネットワーク監視                 |
|                          | @react-native-async-storage/async-storage        | 2.2.0      | 状態の保存                       |
| **国際化**               | i18next                                          | 25.7.2     | i18n エンジン                    |
|                          | react-i18next                                    | 16.4.1     | i18n の React バインディング     |
|                          | react-native-localize                            | 3.6.0      | ロケール検出                     |
| **ユーティリティ**       | react-native-device-info                         | 15.0.1     | デバイス情報                     |
| **テスト**               | jest                                             | 29.6.3     | ユニットテスト                   |
|                          | @testing-library/react-native                    | 13.3.3     | テストユーティリティ             |
|                          | @testing-library/jest-native                     | 5.4.3      | Jest 用マッチャ                  |
|                          | husky                                            | 9.1.7      | Git フック                       |
|                          | lint-staged                                      | 16.2.7     | ステージ済みファイルの Lint      |
| **コード品質**           | eslint                                           | 8.19.0     | JS の Lint                       |
|                          | @typescript-eslint/eslint-plugin                 | 8.48.1     | TypeScript 用 ESLint             |
|                          | @typescript-eslint/parser                        | 8.48.1     | ESLint の TS パーサ              |
|                          | prettier                                         | 3.7.4      | コード整形                       |
|                          | sonarqube-scanner                                | 4.3.2      | SonarQube 品質解析               |
| **開発ツール**           | babel-plugin-module-resolver                     | 5.0.2      | パスエイリアス                   |

*完全な一覧は [`package.json`](./package.json) を参照してください。*

---

## 📁 プロジェクト構成

```text
Timima01App/
├── src/
│   ├── api/             # API 処理: axios インスタンス、エンドポイント、認証
│   ├── components/      # 再利用可能な UI とスタイル
│   ├── config/          # アプリ設定（LogBox など）
│   ├── constants/       # 色、テーマ、定数
│   ├── hooks/           # カスタム React フック
│   ├── i18n/            # 国際化設定と翻訳ファイル
│   ├── navigation/      # ナビゲーターとルーティング型定義
│   ├── providers/       # アプリ全体のコンテキストプロバイダー
│   ├── redux/           # Redux ストア、スライス、永続化設定
│   ├── screens/         # 画面（機能ごとにグループ化）
│   ├── types/           # 共通の TypeScript 型とモジュール宣言
│   └── utils/           # ユーティリティ（エラー・クラッシュ・保存・バリデーションなど）
├── ios/                 # iOS ネイティブプロジェクト
├── android/             # Android ネイティブプロジェクト
├── App.tsx              # アプリのルートコンポーネント
├── index.js             # エントリポイント
├── babel.config.js      # Babel 設定
├── metro.config.js      # Metro バンドラー設定
├── tsconfig.json        # TypeScript 設定
├── package.json         # 依存関係のマニフェスト
├── README.md            # ドキュメント（英語）
└── README.ja.md         # ドキュメント（日本語・本ファイル）
```

#### フォルダの内容例
- **api/**: `axios.ts`, `authApi.ts`, `endpoints.ts`
- **components/**: `Button/`, `ErrorBoundary/`, `OfflineBanner/`
- **screens/**: `Home/`, `Login/`, `Profile/` など
- **i18n/**: `index.ts`, `locales/en.json`, `locales/ja.json`

---

## 🚀 はじめに

### 前提条件

- Node.js >= 18.x
- npm または yarn
- Xcode（iOS 用）
- Android Studio（Android 用）
- GitLab アカウント（CI/CD 用）
- SonarQube サーバーとトークン（コード品質用）

### インストールと実行

```bash
# リポジトリをクローン
git clone https://your-gitlab-repo-url.git
cd Timima01App

# JavaScript 依存関係のインストール
npm install             # または yarn install

# iOS: CocoaPods のインストール
cd ios && pod install && cd ..

# Metro の起動とアプリ実行（`npm install` 後はどの列も同じです）
#   npm script          yarn           npx（ローカル CLI）
npm run ios              # yarn ios       # npx react-native run-ios
npm run android          # yarn android   # npx react-native run-android
npm start                # yarn start     # npx react-native start
```

---

## 🧪 開発とテスト

```bash
# ユニット・統合テスト
npm test

# ウォッチモードとカバレッジ更新
npm test -- --watch
npm test -- --coverage

# Lint とフォーマット
npm run lint
npm run lint:fix

# 型チェック
npm run type-check

# スナップショットの更新
npm test -- -u

# SonarQube 解析（ローカル）
npm run sonar
```

---

## 🔑 API と環境変数

API のエンドポイントや秘密情報は `.env` で設定します。

```env
API_BASE_URL=https://api.example.com
SONAR_HOST_URL=http://your-sonarqube-server:9000
SONAR_TOKEN=your-sonar-token
```

---

## 🌀 CI/CD とコード品質

- プッシュ・マージ時に自動テストと SonarQube スキャンを実行します。
- SonarQube により品質ゲートを適用します。
- GitLab 上で継続的なフィードバック用に CI を構成しています。

---

## 📚 使い方とベストプラクティス

- スケーラブルなコードのため、パスエイリアス（`@components`、`@screens` など）を利用してください。
- 保守性のため、機能ごとに画面用フォルダを分けてください。
- API、設定、スタイル、環境設定は一元管理してください。
- 翻訳は `i18n/locales` で管理してください。
- Husky / lint-staged でコミット前に Lint と型チェックを必須にしてください。

---

## 📝 ライセンス

[MIT](LICENSE)
