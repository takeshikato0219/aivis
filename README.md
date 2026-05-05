# React Native Base Project

A production-ready React Native boilerplate featuring TypeScript, Redux Toolkit, Axios, robust error handling, unit testing, and GitLab CI/CD integration with SonarQube.

**日本語:** [README.ja.md](./README.ja.md)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack & Dependency Versions](#tech-stack--dependency-versions)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [SonarQube Integration](#sonarqube-integration)
- [Code Quality](#code-quality)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

This template helps you kickstart mobile app development with best practices, modular architecture, and automated code quality – all ready for CI/CD with SonarQube analysis.

- **Strict TypeScript:** Enforces type safety throughout the stack.
- **Well-Tested:** Unit and integration tests with high coverage.
- **Advanced CI/CD:** GitLab CI pipeline with code quality gates.
- **Scalable Structure:** Modular, industry-standard organization.
- **Developer Experience:** Clear docs, reusable modules, fast dev cycles.

---

## ✨ Features

### Core Features
- ✅ TypeScript 5.8.3 & Strict Mode
- ✅ Redux Toolkit 2.11.0 & Redux Persist
- ✅ Axios 1.13.2 – global interceptors and error handling
- ✅ Component styles as `.styles.ts` files
- ✅ Centralized API endpoints and constants
- ✅ React Navigation 7.x: stack, tabs, drawer
- ✅ Material Design w/ React Native Paper 5.14.5

### Error Handling
- ✅ Global error boundary (React)
- ✅ Crash reporter (device info logging)
- ✅ Network monitor (online/offline detection, offline banner)
- ✅ Custom hooks for recovery and monitoring

### Quality & Testing
- ✅ ESLint 8.19.0, Prettier 3.7.4, Husky 9.1.7, lint-staged 16.2.7
- ✅ TypeScript static analysis
- ✅ Jest 29.6.3 & @testing-library/react-native 13.3.3
- ✅ High coverage requirement
- ✅ SonarQube scan and quality gate enforced

### CI/CD & Productivity
- ✅ GitLab CI integration
- ✅ Automated test and SonarQube analysis on pull/merge
- ✅ Fast refresh & hot reload
- ✅ Path aliases for imports with babel-plugin-module-resolver
- ✅ API configs in `.env` for easy switching

### UX/UI
- ✅ Responsive design for layouts and orientation
- ✅ Theme system: colors, fonts, spacing
- ✅ Offline banner, loading indicator components

### Internationalization
- ✅ i18next 25.7.2, react-i18next 16.4.1, react-native-localize 3.6.0
- ✅ Built-in English and Japanese translations

---

## 🛠 Tech Stack & Dependency Versions

| Category                 | Package                                         | Version     | Description                       |
|--------------------------|-------------------------------------------------|------------|-----------------------------------|
| **Core**                 | react-native                                    | 0.82.1     | Mobile framework                   |
|                          | react                                           | 19.1.1     | UI library                         |
|                          | typescript                                      | 5.8.3      | Type-safe development              |
| **Navigation**           | @react-navigation/native                        | 7.1.24     | Core navigation                    |
|                          | @react-navigation/stack                         | 7.6.11     | Stack navigation                   |
|                          | @react-navigation/bottom-tabs                   | 7.8.11     | Tab navigation                     |
|                          | @react-navigation/drawer                        | 7.7.8      | Drawer navigation                  |
|                          | react-native-screens                            | 4.18.0     | Screen optimization                |
|                          | react-native-safe-area-context                  | 5.6.2      | Safe areas                         |
|                          | react-native-gesture-handler                    | 2.29.1     | Gesture management                 |
| **State Management**     | @reduxjs/toolkit                                | 2.11.0     | State management                   |
|                          | react-redux                                     | 9.2.0      | Redux bindings                     |
|                          | redux-persist                                   | *          | Persist Redux store                |
| **UI Components**        | react-native-paper                              | 5.14.5     | Material Design UI                 |
|                          | react-native-vector-icons                       | 10.3.0     | Icon set                           |
| **Network & Storage**    | axios                                           | 1.13.2     | HTTP client                        |
|                          | @react-native-community/netinfo                 | 11.4.1     | Network monitoring                 |
|                          | @react-native-async-storage/async-storage       | 2.2.0      | State storage                      |
| **Internationalization** | i18next                                         | 25.7.2     | i18n engine                        |
|                          | react-i18next                                   | 16.4.1     | React bindings for i18n            |
|                          | react-native-localize                           | 3.6.0      | Locale detection                   |
| **Utilities**            | react-native-device-info                        | 15.0.1     | Device info                        |
| **Testing**              | jest                                            | 29.6.3     | Unit testing                       |
|                          | @testing-library/react-native                   | 13.3.3     | Testing utilities                   |
|                          | @testing-library/jest-native                    | 5.4.3      | Jest matchers                      |
|                          | husky                                           | 9.1.7      | Git hooks                          |
|                          | lint-staged                                     | 16.2.7     | Staged linting                     |
| **Code Quality**         | eslint                                          | 8.19.0     | JS linting                         |
|                          | @typescript-eslint/eslint-plugin                | 8.48.1     | ESLint for TS                      |
|                          | @typescript-eslint/parser                       | 8.48.1     | ESLint TS parser                   |
|                          | prettier                                        | 3.7.4      | Code formatting                    |
|                          | sonarqube-scanner                               | 4.3.2      | SonarQube quality analysis         |
| **Dev Tools**            | babel-plugin-module-resolver                    | 5.0.2      | Path aliases                       |

*See [`package.json`](./package.json) for the complete list.*

---

## 📁 Project Structure

```text
Timima01App/
├── src/
│   ├── api/             # API logic: axios instance, endpoints, authentication
│   ├── components/      # Reusable UI components and their styles
│   ├── config/          # Application configuration (LogBox, etc.)
│   ├── constants/       # Colors, themes, constants
│   ├── hooks/           # Custom React hooks
│   ├── i18n/            # Internationalization config and translations
│   ├── navigation/      # Navigators and routing types
│   ├── providers/       # App-level context providers
│   ├── redux/           # Redux store, slices, and persistence config
│   ├── screens/         # Application screens, grouped by feature
│   ├── types/           # Shared TypeScript types and module declarations
│   └── utils/           # Utility functions (error/crash handling, storage, validation)
├── ios/                 # iOS native project
├── android/             # Android native project
├── App.tsx              # App root component
├── index.js             # Entry point
├── babel.config.js      # Babel config
├── metro.config.js      # Metro bundler config
├── tsconfig.json        # TypeScript config
├── package.json         # Dependency manifest
└── README.md            # Documentation (this file)
```

#### Example folder contents
- **api/**: `axios.ts`, `authApi.ts`, `endpoints.ts`
- **components/**: `Button/`, `ErrorBoundary/`, `OfflineBanner/`
- **screens/**: `Home/`, `Login/`, `Profile/`, etc.
- **i18n/**: `index.ts`, `locales/en.json`, `locales/ja.json`

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- Xcode (for iOS)
- Android Studio (for Android)
- GitLab Account (for CI/CD)
- SonarQube server and token (for code quality)

### Install and Run

```bash
# Clone the repo
git clone https://your-gitlab-repo-url.git
cd Timima01App

# Install JavaScript dependencies
npm install             # or yarn install

# iOS: Install CocoaPods
cd ios && pod install && cd ..

# Start Metro and run the app (pick one column — they are equivalent after npm install)
#   npm script          yarn           npx (local CLI)
npm run ios              # yarn ios       # npx react-native run-ios
npm run android          # yarn android   # npx react-native run-android
npm start                # yarn start     # npx react-native start
```

---

## 🧪 Development & Testing

```bash
# Unit and Integration tests
npm test

# Watch mode and update coverage
npm test -- --watch
npm test -- --coverage

# Linting and formatting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Update snapshots
npm test -- -u

# SonarQube analysis (local)
npm run sonar
```

---

## 🔑 API & Environment Variables

Set API endpoints and secrets via `.env`:

```env
API_BASE_URL=https://api.example.com
SONAR_HOST_URL=http://your-sonarqube-server:9000
SONAR_TOKEN=your-sonar-token
```

---

## 🌀 CI/CD & Code Quality

- Automated test and SonarQube scan on push and merge.
- Quality gates enforced via SonarQube.
- CI configured on GitLab for continuous feedback.

---

## 📚 Usage & Best Practices

- Use path aliases (`@components`, `@screens`, etc.) for scalable code.
- Place feature screens in dedicated folders for maintainability.
- Centralize API, config, styling, and environment settings.
- Maintain translations in `i18n/locales`.
- Enforce lint and type check pre-commit via Husky/Lint-Staged.

---

---

## 📝 License

[MIT](LICENSE)