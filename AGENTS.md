<!-- BEGIN:mobile-app-performance-rules -->
# ?? CRITICAL MOBILE APP ARCHITECTURE & PERFORMANCE RULES

All contributors and AI agents working on the Muslim Atlas mobile app must adhere to these architecture and performance constraints:

## 1. Sensor, Magnetometer & Location Lifecycle
- Always clean up event listeners, sensor subscriptions (e.g. `Magnetometer.addListener`, `Location.watchPositionAsync`), and timers in `useEffect` return cleanup functions.
- Throttle high-frequency sensor updates (e.g. compass/magnetometer reading interval >= 100ms) to prevent UI thread starvation and excessive battery drain.
- Request fine/coarse location permissions gracefully with clear user rationale dialogs before prompting system permission dialogs.

## 2. Offline-First & Calculation Performance
- Prayer calculation using `adhan` must be executed locally on the device without requiring network connectivity.
- Cache calculated prayer times, mosque search results, and user preferences locally in `@react-native-async-storage/async-storage` for instant offline app launches.
- Never block the UI thread during heavy calculations or large geo-dataset filtering (e.g. filtering thousands of mosques); use background worker tasks, worklets, or memoized selectors.

## 3. UI Thread & 60 FPS Animation Standards
- Use `react-native-reanimated` worklets for gesture interactions, bottom sheets (`@gorhom/bottom-sheet`), and smooth transitions.
- Avoid passing inline object/array literals or anonymous arrow functions in render loops for heavy list items (e.g. FlatList/FlashList for mosque directories).
<!-- END:mobile-app-performance-rules -->

<!-- BEGIN:engineering-workflow -->
# ?? ORGANIZATION ENGINEERING WORKFLOW & HARD GATES

All contributors and AI agents working in this repository must strictly adhere to the company-standard engineering workflow:

## 1. Branching & Commit Conventions
- Work is organized around Jira tickets under project key `MA` on board 7.
- **Never commit directly to `main`**. All work begins on an isolated branch.
- **Branch Naming Standard:** `<type>/<TICKET-KEY>-<short-description>`
  - Types: `feat`, `fix`, `test`, `refactor`, `perf`, `docs`, `chore`, `ci`, `spike`, `hotfix`
  - Ticket Key: Must be uppercase (e.g., `MA-3`, `MA-1`)
  - Description: 2?5 lowercase words in kebab-case (e.g., `qibla-compass`, `app-engineering-workflow`)
  - Valid Examples: `feat/MA-3-qibla-compass`, `fix/MA-18-prayer-offset`, `chore/MA-1-app-engineering-workflow`
  - Anti-patterns to reject: `yusuf/fix-compass` ? (personal prefixes), `MA-3` ? (missing type/slug), `feature/compass` ? (`feature` instead of `feat`), `feat/ma-3-compass` ? (lowercase key).
- **Branch Lifecycle & Deletion:** Branches are short-lived and dedicated to a single ticket. Once a PR is squash-merged into `main`, GitHub automatically deletes the remote branch. The agent/developer switches to `main`, pulls with pruning (`git pull --prune`), and deletes the local branch (`git branch -d <branch>`).
- **Commit Messages:** Must begin with `[MA]` and follow conventional commits:
  `[MA] type(scope): description (MA-n)`
- **Pull Request Titles:** Must match the commit format:
  `[MA] type(scope): description (MA-n)`

## 2. Mandatory Human Confirmation Gates (Hard-Gates)
Agents must **never take autonomous action on external platforms (Jira, GitHub, App Store/Play Store) without explicit user confirmation**. Always display the payload and wait for approval:
1. **Gate 1 (Jira):** Present draft ticket summary, description, criteria, and Fibonacci story points ? wait for confirmation. All new tickets are created in **`Backlog`** with the correct issue type (Story / Bug / Task / Spike) and the Jira native Story Points field always set. Agents must **NEVER** transition a ticket into `Ready for Development` unless the owner explicitly instructs to do so.
2. **Gate 2 (Branch):** Present branch name and Jira status transition ? wait for confirmation.
3. **Gate 3 (PR):** Present PR title, description, test evidence, and diff overview ? wait for confirmation before opening PR.
4. **Gate 4 (Review):** Present review comments and suggested verdict ? wait for confirmation before submitting review.
5. **Gate 5 (Merge):** Confirm all CI checks are green and present squash-merge summary ? wait for confirmation before merging.
6. **Gate 6 (Release / Store Deploy):** Present release APK/AAB build details, version bump, and change notes ? wait for owner approval before initiating app store deployment.

## 3. Testing & TDD Standard
- All calculation utilities, state managers, hooks, and core UI components must follow Test-Driven Development (TDD).
- Changed-line test coverage must be >= 80%.
- Bug fixes must include a regression test reproducing the issue.
- Run tests locally with `npm test` before committing.
<!-- END:engineering-workflow -->
