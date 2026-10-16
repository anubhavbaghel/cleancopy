# Clean Copy 📋✨

A lightweight, high-performance Chrome Extension that automatically trims unwanted ending spaces, trailing newlines, and non-breaking spaces whenever you copy text in **Google Docs** and across the web.

---

## 🎯 The Problem

When you copy text from Google Docs:
- Double-clicking a word often appends an unwanted trailing space (`"word "`).
- Copying a sentence or paragraph frequently attaches an end-of-paragraph newline (`\r\n`), throwing your cursor onto the next line when pasted into forms, code editors, search bars, or terminal windows.

## ⚡ The Solution

**Clean Copy** solves this seamlessly and invisibly:
- Synchronously intercepts the copy pipeline.
- Automatically strips trailing whitespace, newlines (`\r\n`), tabs, and `\u00A0` non-breaking spaces.
- Cleans both plain text and rich-text HTML formats.
- **Zero lag, zero permissions prompt, 100% native.**

---

## 🚀 Installation

1. **Clone or Download this repository:**
   ```bash
   git clone https://github.com/anubhavbaghel/cleancopy.git
   ```
2. Open Google Chrome (or Edge / Brave / any Chromium browser) and go to:
   ```
   chrome://extensions/
   ```
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** (top-left).
5. Select the cloned folder.
6. Done! Clean Copy is now active in your browser.

---

## 🛠️ Usage

1. Highlight any text or double-click a word in **Google Docs** or on any website.
2. Press `Ctrl + C` (or `⌘ + C` on Mac) or right-click $\rightarrow$ **Copy**.
3. A subtle green notification confirms: `✓ Trimmed ending space & newline`.
4. Paste anywhere (`Ctrl + V`) — your cursor will stay right at the end of the text on the same line!

To disable temporarily, click the extension icon in your Chrome toolbar and toggle it **OFF**.

---

## ⚙️ Technical Highlights

- **Manifest V3 Architecture:** Uses Chrome's `MAIN` world script execution to hook directly into the DOM copy pipeline (`DataTransfer.prototype.setData`), avoiding sandbox delays or permissions popups.
- **Isolated State Management:** Settings are stored in `chrome.storage.sync` and communicated across frames securely.
- **Cross-Frame Support:** Operates seamlessly across Google Docs' nested iframes (`docs-texteventtarget-iframe`).

---

## 📄 License

MIT License. Free to use and modify!
