# Design Audit & Brand Elevation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all typography inconsistencies, dark mode contrast breaks, and flat floating controls across MosqueMap while strictly adhering to our established branding guidelines.

**Architecture:** Refactor `MosqueDetailSheet` and `RoutePreviewOverlay` to eliminate hardcoded colors in favor of dynamic `theme` tokens; adjust `HomeScreen` typography to follow the 3-tier brand hierarchy; and upgrade `MapScreen` floating pills to Liquid Glass styling.

**Tech Stack:** React Native, Expo 54, `useTheme()`, `@gorhom/bottom-sheet`, Jest, `@testing-library/react-native`.

**Spec:** [docs/superpowers/specs/2026-09-13-design-audit-remediation-design.md](file:///c:/Development/MosqueMap/docs/superpowers/specs/2026-09-13-design-audit-remediation-design.md)

## Global Constraints
- Preserve exact brand fonts: `Unbounded-Bold` for main display titles, `Syne-Bold` for subheadings/controls, system font for body descriptions.
- Zero hardcoded colors in component styles that break in Dark Mode.
- All automated tests in `npm test` must continue to pass 100%.

---

### Task 1: MosqueDetailSheet Theming & Dark Mode Remediation

**Files:**
- Modify: `src/components/MosqueDetailSheet.js`
- Test: `npm test`

**Interfaces:**
- Consumes: `useTheme()` tokens (`theme.card`, `theme.border`, `theme.text`, `theme.subText`, `theme.chipBg`).
- Produces: Seamless Dark Mode rendering without harsh light-grey cards or dark text.

- [ ] **Step 1: Replace hardcoded colors in `statsRow`, `actionBtn`, and `card`**
- [ ] **Step 2: Update `sectionTitle` from `Unbounded-Bold` to `Syne-Bold`**
- [ ] **Step 3: Run `npm test` to verify zero regression**
- [ ] **Step 4: Commit Task 1**

```bash
git add src/components/MosqueDetailSheet.js
git commit -m "style: fix dark mode theming and typography in MosqueDetailSheet"
```

---

### Task 2: RoutePreviewOverlay Theming & Hierarchy Remediation

**Files:**
- Modify: `src/components/RoutePreviewOverlay.js`
- Test: `npm test`

**Interfaces:**
- Consumes: `useTheme()` tokens for modal backgrounds, bottom sheet drawer, and search inputs.
- Produces: Dark Mode compliant route preview sheet with clean typography.

- [ ] **Step 1: Replace hardcoded `#fff` on `bottomSection` and `searchModal` with `theme.card` and `theme.background`**
- [ ] **Step 2: Demote `sectionLabel`, `parkingTitle`, and `cancelText` to `Syne-Bold`**
- [ ] **Step 3: Run `npm test` to verify zero regression**
- [ ] **Step 4: Commit Task 2**

```bash
git add src/components/RoutePreviewOverlay.js
git commit -m "style: fix dark mode theming and typography in RoutePreviewOverlay"
```

---

### Task 3: HomeScreen Typography Hierarchy Alignment

**Files:**
- Modify: `src/screens/HomeScreen.js`
- Test: `npm test`

**Interfaces:**
- Consumes: Brand font guidelines.
- Produces: Consistent 3-tier hierarchy across home dashboard.

- [ ] **Step 1: Update `primarySubtitle` and `countdownStartsIn` to system font**
- [ ] **Step 2: Add `fontVariant: ['tabular-nums']` to `prayerTime` and set `prayerName` to `Syne-Bold`**
- [ ] **Step 3: Run `npm test` to verify zero regression**
- [ ] **Step 4: Commit Task 3**

```bash
git add src/screens/HomeScreen.js
git commit -m "style: standardize typography hierarchy in HomeScreen"
```

---

### Task 4: MapScreen Liquid Glass Navigation Controls & List Theming

**Files:**
- Modify: `src/screens/MapScreen.js`
- Test: `npm test`

**Interfaces:**
- Consumes: Liquid Glass styling rules (`rgba` translucency + hairline specular highlight).
- Produces: Modern floating search and category pills with dark mode support.

- [ ] **Step 1: Upgrade `searchPill`, `categoryTogglePill`, and `togglePill` to Liquid Glass styling**
- [ ] **Step 2: Replace hardcoded `#fff` in `uberCard` and `listHeader` with `theme.card` and `theme.border`**
- [ ] **Step 3: Run `npm test` to verify zero regression**
- [ ] **Step 4: Commit Task 4**

```bash
git add src/screens/MapScreen.js
git commit -m "style: implement liquid glass floating controls and list theming in MapScreen"
```

---

### Task 5: Full Regression Testing & Verification

**Files:**
- Run: `npm run test:coverage`

- [ ] **Step 1: Run complete test suite and verify all tests pass**
- [ ] **Step 2: Commit final status**
