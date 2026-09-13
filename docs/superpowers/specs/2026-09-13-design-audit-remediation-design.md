# Design Audit & Brand Visual Elevation Specification

- **Project**: MosqueMap (Expo / React Native)
- **Date**: 2026-09-13
- **Author**: Antigravity & Yusuf
- **Status**: Approved

---

## 1. Objectives & Guidelines

Elevate the visual craft of MosqueMap across all core surfaces ([HomeScreen](file:///c:/Development/MosqueMap/src/screens/HomeScreen.js), [MapScreen](file:///c:/Development/MosqueMap/src/screens/MapScreen.js), [MosqueDetailSheet](file:///c:/Development/MosqueMap/src/components/MosqueDetailSheet.js), and [RoutePreviewOverlay](file:///c:/Development/MosqueMap/src/components/RoutePreviewOverlay.js)) while strictly preserving existing branding, logos, color identity (Emerald & Slate), and typography rules:

1. **Brand Typography System**:
   * `Unbounded-Bold`: Reserved for display titles, hero banners, and primary sheet headers.
   * `Syne-Bold`: For all section titles, row headings, control labels, button text, and badges.
   * Native iOS / System Font: For generic descriptive body text, explanatory footers, timestamps, and addresses.
   * Tabular Numbers (`fontVariant: ['tabular-nums']`): On all dynamic counters, countdown timers, and prayer times.
2. **Theming & Dark Mode Floor (`impeccable`)**:
   * Replace all hardcoded hex values (`#fff`, `#111`, `#f7f8fa`, `#eee`, `#555`) with dynamic `theme` tokens (`theme.background`, `theme.card`, `theme.text`, `theme.subText`, `theme.border`, `theme.tint`).
3. **Liquid Glass Navigation Layer (`liquid-glass`)**:
   * Transform floating controls on the map (Search Pill, Category Pill, View Mode Toggle) into translucent glass surfaces (`rgba(255,255,255,0.85)` / `rgba(30,41,59,0.85)`) with a hairline specular highlight border (`borderColor: 'rgba(255,255,255,0.25)'`).
4. **Spatial Layout & Micro-Interactions**:
   * Upgrade action buttons in `MosqueDetailSheet` to squircle badges matching `SettingsScreen`.

---

## 2. Component-by-Component Specifications

### 2.1 `HomeScreen.js`
* Fix `primarySubtitle` and `countdownStartsIn` to use clean system typography rather than `Syne-Regular`.
* Add `fontVariant: ['tabular-nums']` to `prayerTime`.
* Ensure `prayerName` is styled with `Syne-Bold`.

### 2.2 `MosqueDetailSheet.js`
* Replace hardcoded `#f7f8fa` on `statsRow`, `actionBtn`, and `card` with dynamic `theme.card` (with subtle border `theme.border`).
* Replace hardcoded text colors (`#111`, `#222`, `#444`, `#555`, `#666`) with `theme.text` and `theme.subText`.
* Change `sectionTitle` from `Unbounded-Bold` to `Syne-Bold`.
* Upgrade action buttons (`Directions`, `Call`, `Share`, `Website`) to squircle icon containers with `Syne-Bold` labels.

### 2.3 `MapScreen.js`
* Upgrade `searchPill`, `categoryTogglePill`, and `togglePill` to Liquid Glass styling:
  * Translucent background reflecting map surface underneath.
  * 1px subtle specular border (`rgba(255,255,255,0.2)` in dark mode, `rgba(255,255,255,0.6)` in light mode).
  * Soft ambient elevation/shadow.
* Replace hardcoded `#fff` in `uberCard` and `listHeader` with `theme.card` and `theme.border`.

### 2.4 `RoutePreviewOverlay.js`
* Replace hardcoded `#fff` on `bottomSection` and `searchModal` with `theme.card` and `theme.background`.
* Demote overuse of `Unbounded-Bold` on minor sub-labels (`sectionLabel`, `parkingTitle`, `cancelText`) to `Syne-Bold`.

---

## 3. Verification & Acceptance Criteria
* Automated Jest tests continue to pass 100% (0 regressions).
* Manual inspection in Light and Dark Mode confirms zero white glare or unreadable text.
* Typography visually adheres to the 3-tier hierarchy across all 4 screens.
