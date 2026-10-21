# Clean Copy 📋✨

A lightweight, high-performance Chrome Extension that automatically trims unwanted ending spaces, trailing newlines, and non-breaking spaces whenever you copy text in **Google Docs** and across the web.

---

## 🎯 The Problem

When you copy text from Google Docs or web pages:
- Double-clicking a word often appends an unwanted trailing space (`"word "`).
- Copying a sentence or paragraph attaches an end-of-paragraph newline (`\r\n`), throwing your cursor onto the next line when pasted into forms, code editors, search bars, Wix CMS fields, or terminal windows.
- In rich text editors like **Wix Editor (FAQ and CMS fields)**, pasted HTML contains `<p>` block tags that force the cursor into a new block on the next line.

## ⚡ The Solution

**Clean Copy** solves this seamlessly and invisibly:
- Synchronously intercepts both copy (`setData`) and paste (`getData`) pipelines.
- Strips trailing whitespace, newlines (`\r\n`, `\n`), tabs, non-breaking spaces (`\u00A0`), and zero-width spaces (`\u200B`).
- Sanitizes rich-text HTML: automatically converts single-paragraph blocks (`<p>`, `<div>`) into inline spans so **Wix Editor FAQ & CMS** fields paste cleanly inline without jumping to the next line.
- Intercepts native browser copy and paste events across all standard web pages and inputs.
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
