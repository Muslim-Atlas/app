## Description

<!-- Provide a concise summary of what this PR changes and why. -->

## Linked Jira Ticket
- Jira Ticket: [MA-](https://yqwebstudio.atlassian.net/browse/MA-)

## Steps to View / Test the Feature
<!-- Provide clear step-by-step instructions for the reviewer or QA to view, interact with, and verify this feature or fix in local emulator or device. -->
1. **Prerequisites / Environment**: e.g. Start app with `npm start` and run on Android emulator or physical device.
2. **Navigate to**: e.g. Home screen, Mosque Map, Qibla screen, Settings.
3. **Action**: e.g. Tap pin, change calculation method, test location permission, etc.
4. **Verify**: e.g. Verify prayer times update, compass rotates smoothly, navigation modal opens.

## Type of Change
- [ ] `feat`: New feature or capability
- [ ] `fix`: Bug fix
- [ ] `perf`: Performance improvement
- [ ] `refactor`: Code refactoring without behavior changes
- [ ] `test`: Adding or updating test cases
- [ ] `docs`: Documentation updates
- [ ] `ci`: CI/CD pipeline or workflow changes
- [ ] `chore`: Maintenance / tooling updates

## Native / Expo Configuration Changes
- [ ] **None** (Pure JavaScript/React Native changes)
- [ ] **App Config / Plugin** (`app.config.js`, `eas.json`)
- [ ] **Native Permissions** (Location, Background fetch, Notifications)
- [ ] **Native Build Required** (`npx expo run:android` / `npx expo run:ios`)

## Test Verification & Evidence
<!-- TDD is required. Provide test command output and/or screenshots -->
- [ ] Unit / Integration Tests (`npm test`):
```text
<!-- Paste Jest test summary output here -->
```

## AI Agent Usage
- [ ] Built with AI Agent assistance (e.g. Antigravity, Claude Code, Cursor)
- Agent Model:
- Human Verification Performed:

## Definition of Done Checklist
- [ ] PR title follows convention: `[MA] type(scope): description (MA-n)`
- [ ] Acceptance criteria from Jira ticket are met
- [ ] Tests written first (TDD) and passing
- [ ] Changed-line test coverage >= 80%
- [ ] No secrets or API keys exposed in diff
- [ ] Tested on Android emulator or physical device
