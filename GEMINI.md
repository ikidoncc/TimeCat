# GEMINI.md - Project Context

## 1. Project Overview
TimeCat is a Chrome Extension designed to improve digital well-being by enforcing mandatory breaks. It monitors continuous browser usage and blocks all interaction when a pre-configured time limit is reached, forcing the user to take a break for a specific duration.

## 2. Tech Stack
- **Architecture**: Chrome Extension Manifest V3.
- **Languages**: JavaScript (ESNext), HTML5, CSS3.
- **APIs**:
  - `chrome.tabs`: Monitoring tab activity and sending messages.
  - `chrome.storage`: Persisting user settings and session state.
  - `chrome.runtime`: Communication between background and content scripts.
  - `chrome.windows`: Detecting browser focus changes.

## 3. Architecture
The system is divided into three main components:
- **Background (Service Worker)**: Acts as the "source of truth". It maintains the timer, tracks the active tab, manages the block state, and broadcasts updates to all tabs.
- **Content Scripts**: Injected into every web page. Responsible for rendering the blocking overlay, intercepting user input, and implementing anti-bypass measures.
- **Options Page**: A dedicated UI for users to configure usage limits and break durations.
- **Communication**: Uses a "Broadcast & Handshake" model via `chrome.runtime.sendMessage` and `chrome.tabs.sendMessage`.

## 4. Core Features (Implemented)
- **Time Tracking**: Accurate per-tab continuous usage monitoring.
- **Forced Break System**: Automatic blocking of web pages upon reaching limits.
- **Blocking Overlay**: A full-screen, high-priority UI that covers 100% of the viewport.
- **Countdown System**: Real-time synchronized countdown across all tabs.
- **Anti-Bypass Protection**: `MutationObserver` and heartbeat checks to prevent manual DOM deletion of the block.
- **Settings Management**: Persistent configuration for usage and break intervals.

## 5. Development Rules
- **Modern APIs**: Always use stable Manifest V3 APIs.
- **Language**: All code, comments, and documentation must be in **English**.
- **Modularity**: Keep logic separated (Background for state, Content for UI).
- **Documentation**: Comment all non-trivial logic, focusing on the "why".
- **Surgical Edits**: Prefer targeted updates over full file rewrites.
- **Consistency**: Adhere to existing naming conventions and styling.

## 6. Git Workflow (MANDATORY)
- **Granularity**: Commit after EACH logical feature or fix.
- **Language**: Commit messages MUST be in English.
- **Format**: Follow the Conventional Commits-like pattern:
  - `feat: <description>`
  - `fix: <description>`
  - `refactor: <description>`
  - `docs: <description>`

## 7. Future Features (Planned)
- **Whitelist**: Exclude specific domains from being blocked.
- **Analytics**: Daily and weekly usage statistics dashboard.
- **Pre-block Notifications**: Warning sounds or messages 1 minute before blocking.
- **Cloud Sync**: Sync settings across different Chrome instances.
- **Theming**: Dark/Light mode and custom themes for the overlay.

## 8. How to Continue This Project
- **Context First**: Any AI assistant must read this `GEMINI.md` before suggesting changes.
- **Integrity**: Never rewrite core timing or blocking logic without a proven bug.
- **Incremental**: Add features one by one, verifying each with the background-content messaging flow.
- **Validation**: Always ensure `MutationObserver` logic is updated if the overlay structure changes.

## 9. Setup Instructions
1. Load the `time-cat` folder via `chrome://extensions/` using "Load unpacked".
2. Enable "Developer Mode".
3. To test: Set 1-minute usage/break limits in Options and browse any site.

## 10. Constraints
- **Unbypassable**: The overlay must be extremely difficult to remove via DevTools.
- **Priority**: Overlay must use maximum `z-index` and `position: fixed`.
- **Reliability**: State must persist across page reloads and tab switches.
