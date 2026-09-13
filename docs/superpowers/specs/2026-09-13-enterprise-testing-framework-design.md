# Enterprise Testing Architecture Design Specification

- **Project**: MosqueMap (Expo / React Native 0.81+ / React 19)
- **Date**: 2026-09-13
- **Author**: Antigravity & Yusuf
- **Status**: Approved

---

## 1. Executive Summary & Objective

Transform the MosqueMap mobile project from manual ad-hoc testing into a mature, company-grade engineering standard. This document specifies an automated **Testing Pyramid** tailored for Expo and React Native:
1. **Unit & Domain Logic Testing (Jest + `jest-expo`)**: High-speed, headless tests for mathematical prayer engines, timetable parsers, and context state reducers.
2. **Component & Integration Testing (`@testing-library/react-native`)**: User-centric accessibility and interaction tests for screens and modals without requiring a running simulator.
3. **Native Mobile E2E Automation (Maestro)**: Declarative, reliable user journey automation running on Android Emulator and Dev Client devices.
4. **Continuous Integration (GitHub Actions)**: Automated PR gate enforcing lint checks, unit tests, and coverage thresholds on every commit.

---

## 2. Testing Pyramid & System Architecture

```
                 / \
                /   \
               / E2E \         Maestro (Android Dev Client / Emulator)
              /-------\
             /  Integ  \       @testing-library/react-native (RNTL)
            /-----------\
           /    Unit     \     Jest + jest-expo (Prayer Math, Reducers, Parsers)
          /---------------\
```

### 2.1 Layer 1: Unit Testing (Fast Headless Node.js)
* **Runner**: Jest 29 with `jest-expo` preset.
* **Scope**: Pure logic, calculations, date manipulation, and state updates.
* **Execution Time Target**: < 3 seconds for full suite.
* **Critical Targets**:
  * `src/utils/prayerEngine.js`: Calculations for Fajr, Dhuhr, Asr (Standard vs. Hanafi), Maghrib, Isha; manual minute adjustments; calculation authority methods (Moonsighting Committee, MWL, ISNA, Egypt, Karachi).
  * `src/context/PrayerSettingsContext.js` & `src/context/MosqueContext.js`: Reducer transitions, default state initialization, filtering algorithms, and geographic distance calculations.

### 2.2 Layer 2: Component & Integration Testing (RNTL)
* **Framework**: `@testing-library/react-native` (v13+) with `@testing-library/jest-native`.
* **Scope**: UI rendering, event dispatching (press, scroll, input), accessibility labels, and state binding.
* **Critical Targets**:
  * `src/components/SettingsScreen.js`:
    * Rendering calculation method selector.
    * Verifying "Muslim Atlas (Default)" presence and selection.
    * Toggling notification preferences and theme modes.
    * Verifying interactions invoke `AsyncStorage.setItem`.
  * `src/components/MosqueDetailSheet.js`:
    * Renders mosque metadata correctly.
    * Emits navigation and favorite callbacks on button presses.
  * `src/screens/MapScreen.js`:
    * Renders map container with mock Mapbox layers.
    * Does not crash on missing coordinates or initial null states.

### 2.3 Layer 3: Native Mobile E2E Automation (Maestro)
* **Framework**: [Maestro](https://maestro.mobile.dev/) (`.maestro/` configuration).
* **Scope**: Complete user journeys on Android Emulator / Dev Client binary.
* **Key Flows**:
  * `01_app_launch_and_permissions.yaml`:
    * Launch `com.yusufq.mosquemap`.
    * Verify permission dialogue dismissal or auto-grant.
    * Verify Home / Map view displays.
  * `02_mosque_selection_and_timetable.yaml`:
    * Tap a visible mosque card or marker.
    * Assert bottom sheet expands with prayer times visible.
  * `03_settings_persistence.yaml`:
    * Open settings tab.
    * Select calculation method.
    * Toggle a preference.
    * Restart app and assert settings remain persisted.

### 2.4 Layer 4: CI/CD Quality Gate (GitHub Actions)
* **Workflow File**: `.github/workflows/ci.yml`
* **Triggers**: Push to `main`, pull requests against `main`.
* **Steps**:
  1. Checkout repository.
  2. Setup Node.js (v20 LTS) with npm cache.
  3. Install dependencies (`npm ci`).
  4. Run syntax & lint check (`npm run lint` or syntax validation).
  5. Run Jest tests with coverage (`npm test -- --ci --coverage --maxWorkers=2`).
  6. Enforce zero failing tests policy to merge PRs.

---

## 3. Mocking Infrastructure (`jest.setup.js`)

React Native projects with native dependencies require clear, centralized mocks so tests run reliably in headless Node without missing native binary bindings:

1. **`@rnmapbox/maps`**:
   * Mock `MapView`, `Camera`, `ShapeSource`, `SymbolLayer`, `LineLayer`, `PointAnnotation`, and `MarkerView` as simple React Native `View` elements.
   * Mock static methods: `setAccessToken`, `requestAndroidLocationPermissions`.
2. **`expo-location`**:
   * Mock `requestForegroundPermissionsAsync` returning `{ status: 'granted' }`.
   * Mock `getCurrentPositionAsync` returning fixed coordinates (`{ coords: { latitude: 51.5074, longitude: -0.1278 } }`).
3. **`expo-notifications`**:
   * Mock notification scheduling and permission handlers.
4. **`@react-native-async-storage/async-storage`**:
   * Use the official in-memory mock from `@react-native-async-storage/async-storage/jest/async-storage-mock`.
5. **`react-native-reanimated` & `@gorhom/bottom-sheet`**:
   * Use official Reanimated test setup mock (`react-native-reanimated/mock`).
6. **`react-native-android-widget`**:
   * Mock `requestWidgetUpdate` and widget rendering components.

---

## 4. Package Dependencies & NPM Scripts

### Required DevDependencies:
```json
{
  "devDependencies": {
    "@testing-library/jest-native": "^5.4.3",
    "@testing-library/react-native": "^13.0.1",
    "jest": "^29.7.0",
    "jest-expo": "~54.0.0"
  }
}
```

### Scripts in `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "maestro test .maestro/"
  }
}
```

---

## 5. File & Directory Layout

```
MosqueMap/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .maestro/
│   ├── config.yaml
│   ├── 01_app_launch_and_permissions.yaml
│   ├── 02_mosque_selection_and_timetable.yaml
│   └── 03_settings_persistence.yaml
├── __tests__/
│   ├── unit/
│   │   ├── prayerEngine.test.js
│   │   └── contextReducers.test.js
│   └── components/
│       ├── SettingsScreen.test.js
│       ├── MosqueDetailSheet.test.js
│       └── MapScreen.test.js
├── jest.config.js
├── jest.setup.js
└── package.json
```

---

## 6. Verification & Acceptance Criteria

1. **Unit Test Pass**: `npm test` runs all suites and completes with 0 errors.
2. **Coverage Threshold**: At least 80% statement coverage on core domain logic (`prayerEngine.js`).
3. **Fast Feedback**: Total unit and component test suite execution time under 10 seconds locally.
4. **E2E Readiness**: Maestro configuration file and sample test flows validate syntax and execute against an active Android emulator.
5. **CI Operational**: The GitHub Actions workflow file passes YAML validation and executes the test steps cleanly.
