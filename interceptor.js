/**
 * Clean Copy Main World Interceptor
 * Runs directly in the page context (MAIN world) across all frames.
 *
 * Capabilities:
 * 1. DataTransfer.prototype.setData:
 *    Intercepts Google Docs canvas copy engine & custom web apps.
 *    Strips trailing newlines, spaces, non-breaking spaces, and converts
 *    single-paragraph block HTML (<p>, <div>, <h1-6>) into inline <span>
 *    so rich editors (like Wix Editor FAQ & CMS) do not jump to the next line.
 *
 * 2. DataTransfer.prototype.getData:
 *    Intercepts paste reads by rich text editors (Wix FAQ/CMS, Draft.js, ProseMirror, Slate).
 *    Guarantees clean plain text and unwrapped inline HTML even if copied externally.
 *
 * 3. Native 'copy' event capture:
 *    Handles standard website text selection and Wix text fields where
 *    browsers natively include block-end newlines without calling setData.
 *
 * 4. Native 'paste' event capture:
 *    Safely strips trailing spaces & newlines when pasting into <input> and <textarea>
 *    fields (e.g. Wix CMS title/text cells, FAQ questions).
 */

(function () {
  'use strict';

  if (window.__CLEANCOPY_INTERCEPTOR__) return;
  window.__CLEANCOPY_INTERCEPTOR__ = true;
  window.__CLEANDOC_INTERCEPTOR__ = true;

  let isEnabled = true;
  let lastSetDataTime = 0;

  // Listen for toggle updates from the isolated content script
  window.addEventListener('message', (e) => {
    if (e.data && (e.data.type === 'CLEANCOPY_CONFIG' || e.data.type === 'CLEANDOC_CONFIG')) {
      isEnabled = e.data.enabled !== false;
    }
  });

  function notifyTrimmed() {
    try {
      window.dispatchEvent(new CustomEvent('cleancopy-trimmed-notify'));
      window.dispatchEvent(new CustomEvent('cleandoc-trimmed-notify'));
    } catch (err) {}
  }

  function sanitizePlainText(text) {
    if (typeof text !== 'string') return text;
    // Strip trailing whitespace, tabs, carriage returns (\r), newlines (\n),
    // non-breaking spaces (\u00A0), zero-width spaces (\u200B), and unicode line/paragraph breaks (\u2028, \u2029)
    return text.replace(/[\s\u00A0\u2000-\u200B\u2028\u2029]+$/, '');
  }

  function sanitizeHtml(html) {
    if (typeof html !== 'string' || !html) return html;

    let cleaned = html;

    // 1. Remove trailing whitespace/newlines outside tags at the end of the string
    cleaned = cleaned.replace(/[\s\u00A0\u2000-\u200B\u2028\u2029]+$/, '');

    // 2. Remove trailing empty block elements like <p><br></p>, <div><br></div>, <p></p>, <div></div>, <br>
    let prev;
    do {
      prev = cleaned;
      cleaned = cleaned.replace(/(?:<p[^>]*>\s*(?:<br\s*\/?>)?\s*<\/p>|<div[^>]*>\s*(?:<br\s*\/?>)?\s*<\/div>|<br\s*\/?>)[\s\u00A0]*$/i, '');
      cleaned = cleaned.replace(/[\s\u00A0]+(<\/(?:p|div|span|b|i|strong|em|body|html)>)$/i, '$1');
    } while (cleaned !== prev);

    // 3. Remove trailing whitespace, &nbsp;, <br> before closing inline or block tags
    cleaned = cleaned.replace(/(?:[\s\u00A0\u2000-\u200B\u2028\u2029]|&nbsp;|<br\s*\/?>)+(<\/(?:span|p|div|b|i|strong|em|a|td|th|li|h[1-6]|label|code|pre)>)/gi, '$1');

    // 4. Special handling for single-block copies (e.g. single paragraph/line from Google Docs):
    // In rich text editors like Wix FAQ & CMS (Draft.js), <p>, <div>, and <h1-6> cause the editor to create
    // an isolated block, which forces the cursor to a new line or creates an empty following paragraph.
    // When exactly one block exists, we convert it to an inline <span> so Wix pastes it inline without jumping.
    const pCount = (cleaned.match(/<p\b[^>]*>/gi) || []).length;
    const hCount = (cleaned.match(/<h[1-6]\b[^>]*>/gi) || []).length;
    const liCount = (cleaned.match(/<li\b[^>]*>/gi) || []).length;
    const divCount = (cleaned.match(/<div\b[^>]*>/gi) || []).length;

    const isSingle = (pCount + hCount + liCount) <= 1 && (pCount > 0 || hCount > 0 || divCount <= 1);

    if (isSingle) {
      cleaned = cleaned.replace(/<p\b([^>]*)>/gi, '<span$1>').replace(/<\/p>/gi, '</span>');
      cleaned = cleaned.replace(/<div\b([^>]*)>/gi, '<span$1>').replace(/<\/div>/gi, '</span>');
      cleaned = cleaned.replace(/<h[1-6]\b([^>]*)>/gi, '<span$1>').replace(/<\/h[1-6]>/gi, '</span>');
    }

    return cleaned;
  }

  // 1. Intercept DataTransfer.prototype.setData (Google Docs canvas engine & custom web apps)
  if (typeof DataTransfer !== 'undefined' && DataTransfer.prototype && DataTransfer.prototype.setData) {
    const originalSetData = DataTransfer.prototype.setData;

    DataTransfer.prototype.setData = function (format, data) {
      lastSetDataTime = Date.now();

      if (isEnabled && typeof data === 'string') {
        const lowerFormat = (format || '').toLowerCase();
        if (lowerFormat === 'text/plain' || lowerFormat === 'text') {
          const trimmed = sanitizePlainText(data);
          if (trimmed !== data) {
            data = trimmed;
            notifyTrimmed();
          }
        } else if (lowerFormat === 'text/html') {
          const cleaned = sanitizeHtml(data);
          if (cleaned !== data) {
            data = cleaned;
          }
        }
      }
      return originalSetData.call(this, format, data);
    };
  }

  // 2. Intercept DataTransfer.prototype.getData (Wix Editor CMS, FAQ, Draft.js, ProseMirror on paste)
  if (typeof DataTransfer !== 'undefined' && DataTransfer.prototype && DataTransfer.prototype.getData) {
    const originalGetData = DataTransfer.prototype.getData;

    DataTransfer.prototype.getData = function (format) {
      const result = originalGetData.call(this, format);

      if (isEnabled && typeof result === 'string') {
        const lowerFormat = (format || '').toLowerCase();
        if (lowerFormat === 'text/plain' || lowerFormat === 'text') {
          return sanitizePlainText(result);
        } else if (lowerFormat === 'text/html') {
          return sanitizeHtml(result);
        }
      }
      return result;
    };
  }

  // 3. Fallback for native browser copy events (regular web pages or Wix text without custom setData)
  window.addEventListener('copy', (e) => {
    if (!isEnabled) return;

    // If setData was already handled recently (e.g. Google Docs), do not duplicate
    if (Date.now() - lastSetDataTime < 150) return;

    let textToCopy = '';
    const activeEl = document.activeElement;

    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && typeof activeEl.selectionStart === 'number') {
      const start = activeEl.selectionStart;
      const end = activeEl.selectionEnd;
      if (start !== end) {
        textToCopy = activeEl.value.substring(start, end);
      }
    } else {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        textToCopy = selection.toString();
      }
    }

    if (textToCopy && e.clipboardData) {
      const trimmed = sanitizePlainText(textToCopy);
      if (trimmed !== textToCopy) {
        e.preventDefault();
        e.clipboardData.setData('text/plain', trimmed);

        // Also extract and sanitize HTML from selection range if present
        try {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const container = document.createElement('div');
            for (let i = 0; i < selection.rangeCount; i++) {
              container.appendChild(selection.getRangeAt(i).cloneContents());
            }
            if (container.innerHTML) {
              e.clipboardData.setData('text/html', sanitizeHtml(container.innerHTML));
            }
          }
        } catch (err) {}

        notifyTrimmed();
      }
    }
  }, false);

  // 4. Intercept paste into standard input / textarea fields (Wix CMS plain text cells, title inputs, FAQ questions)
  window.addEventListener('paste', (e) => {
    if (!isEnabled) return;

    const target = e.target;
    if (!target) return;

    const isInput = target.tagName === 'INPUT' && !['checkbox', 'radio', 'file', 'button', 'submit'].includes(target.type);
    const isTextarea = target.tagName === 'TEXTAREA';

    if (isInput || isTextarea) {
      if (e.clipboardData) {
        const text = e.clipboardData.getData('text/plain');
        if (typeof text === 'string') {
          const trimmed = sanitizePlainText(text);
          if (trimmed !== text) {
            e.preventDefault();
            const inserted = document.execCommand('insertText', false, trimmed);
            if (!inserted) {
              const start = target.selectionStart || 0;
              const end = target.selectionEnd || 0;
              const val = target.value;
              target.value = val.substring(0, start) + trimmed + val.substring(end);
              target.selectionStart = target.selectionEnd = start + trimmed.length;
              target.dispatchEvent(new Event('input', { bubbles: true }));
              target.dispatchEvent(new Event('change', { bubbles: true }));
            }
            notifyTrimmed();
          }
        }
      }
    }
  }, true);
})();
