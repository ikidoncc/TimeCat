# TimeCat 🐾 - Continuous Usage Blocker

**TimeCat** is a Chrome Extension (Manifest V3) designed to improve productivity and health by enforcing mandatory breaks after a period of continuous browser usage.

## 🚀 Features

- **Continuous Monitoring**: Tracks active time on each tab.
- **Mandatory Breaks**: Blocks all interaction when the usage limit is reached.
- **Anti-Bypass Protection**: Uses `MutationObserver` and heartbeat checks to prevent users from deleting the overlay via Developer Tools.
- **Cross-Tab Sync**: The countdown and block state are synchronized across all open windows and tabs.
- **Customizable**: Set your own usage limits and break durations via the Options page.

## 📁 Project Structure

```text
time-cat/
├── manifest.json         # Extension configuration (MV3)
├── background.js          # Service worker (Timer logic & State)
├── content.js             # Script injected into pages (Overlay & Anti-bypass)
├── content.css            # Styles for the blocking overlay
├── options/
│   ├── options.html       # Settings UI
│   ├── options.css        # Settings styling
│   └── options.js         # Settings logic (chrome.storage)
└── README.md              # Documentation
```

## 🛠️ How to Install (Developer Mode)

1. **Download the code**: Ensure all files are in a folder named `time-cat`.
2. **Open Chrome Extensions**:
   - Navigate to `chrome://extensions/` in your Chrome browser.
3. **Enable Developer Mode**:
   - Toggle the switch in the top right corner.
4. **Load Unpacked**:
   - Click the **"Load unpacked"** button.
   - Select the `time-cat` folder you created.
5. **Pin the Extension**:
   - Click the puzzle icon next to the address bar and pin **TimeCat**.

## 🧪 How to Test

1. **Configure Short Intervals**:
   - Right-click the TimeCat icon and select **"Options"**.
   - Set "Maximum continuous use" to **1 minute**.
   - Set "Mandatory break time" to **1 minute**.
   - Click **Save Settings**.
2. **Simulate Usage**:
   - Browse any website (e.g., google.com, github.com) for 60 seconds.
3. **Trigger the Block**:
   - After 60 seconds of active usage, the screen will turn black with a cat message and a countdown.
4. **Try to Bypass**:
   - Try to scroll, click, or even delete the overlay using "Inspect Element". The system will fight back and keep the block active.
5. **Automatic Release**:
   - Wait for the timer to reach `00:00`. The overlay will disappear automatically, and your 1-minute usage cycle will restart.

## 📝 Technical Details

- **Language**: JavaScript (ES6+), HTML5, CSS3.
- **API**: Chrome Extensions API (tabs, storage, runtime, windows).
- **Security**: Implements `stopImmediatePropagation` and `MutationObserver` for robust interaction blocking.
