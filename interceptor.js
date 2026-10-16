/**
 * CleanDoc Main World Interceptor
 * Runs directly in the page context (MAIN world) to intercept Google Docs clipboard writes.
 */

(function () {
  'use strict';

  if (window.__CLEANDOC_INTERCEPTOR__) return;
  window.__CLEANDOC_INTERCEPTOR__ = true;

  let isEnabled = true;

  // Listen for toggle updates from the isolated content script
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'CLEANDOC_CONFIG') {
      isEnabled = e.data.enabled !== false;
    }
  });

  // Intercept DataTransfer.prototype.setData (used by Google Docs canvas copy engine)
  if (typeof DataTransfer !== 'undefined' && DataTransfer.prototype && DataTransfer.prototype.setData) {
    const originalSetData = DataTransfer.prototype.setData;

    DataTransfer.prototype.setData = function (format, data) {
      if (isEnabled && typeof data === 'string') {
        if (format === 'text/plain') {
          // Remove ending spaces, tabs, carriage returns (\r), newlines (\n), and non-breaking spaces (\u00A0)
          const trimmed = data.replace(/[\s\u00A0]+$/, '');
          if (trimmed !== data) {
            data = trimmed;
            try {
              window.dispatchEvent(new CustomEvent('cleandoc-trimmed-notify'));
            } catch (err) {}
          }
        } else if (format === 'text/html') {
          // Clean trailing line breaks, empty spaces, and newlines before closing HTML tags
          const trimmedHtml = data.replace(/(?:[\s\u00A0]|&nbsp;|<br\s*\/?>|\r?\n)+(<\/(?:p|div|span|body|html)>|$)/gi, '$1');
          if (trimmedHtml !== data) {
            data = trimmedHtml;
          }
        }
      }
      return originalSetData.call(this, format, data);
    };
  }
})();
