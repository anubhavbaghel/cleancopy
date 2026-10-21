/**
 * Clean Copy Content Script (Isolated World)
 * Manages storage settings, cross-frame notifications, and visual feedback toast.
 */

(function () {
  'use strict';

  const isTopFrame = window === window.top;
  let enabled = true;
  let showToast = true;
  let toastEl = null;
  let toastTimer = null;

  function syncConfigToPage() {
    try {
      window.postMessage({ type: 'CLEANCOPY_CONFIG', enabled }, '*');
      window.postMessage({ type: 'CLEANDOC_CONFIG', enabled }, '*');
    } catch (e) {}
  }

  // Load user settings from chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get({ enabled: true, showToast: true }, (saved) => {
      if (saved) {
        enabled = saved.enabled !== false;
        showToast = saved.showToast !== false;
      }
      syncConfigToPage();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync') {
        if (changes.enabled !== undefined) enabled = changes.enabled.newValue !== false;
        if (changes.showToast !== undefined) showToast = changes.showToast.newValue !== false;
        syncConfigToPage();
      }
    });
  }

  // Inject toast styles directly in top frame
  if (isTopFrame) {
    const styleEl = document.createElement('style');
    styleEl.id = 'cleancopy-toast-style';
    styleEl.textContent = `
      .cleandoc-trim-toast, .cleancopy-trim-toast {
        position: fixed !important;
        bottom: 24px !important;
        right: 24px !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        background: #0f172a !important;
        color: #f8fafc !important;
        padding: 9px 16px !important;
        border-radius: 8px !important;
        border-left: 4px solid #10b981 !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        user-select: none !important;
        pointer-events: none !important;
        opacity: 0 !important;
        transform: translateY(12px) !important;
        transition: all 0.2s ease-out !important;
      }
      .cleandoc-trim-toast.visible, .cleancopy-trim-toast.visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(styleEl);
    } else {
      document.documentElement.appendChild(styleEl);
    }
  }

  function displayToast(msg = 'Trimmed ending space & newline') {
    if (!showToast || !enabled) return;

    if (!isTopFrame) {
      try {
        window.top.postMessage({ type: 'CLEANCOPY_FORWARD_TOAST', message: msg }, '*');
        window.top.postMessage({ type: 'CLEANDOC_FORWARD_TOAST', message: msg }, '*');
      } catch (e) {}
      return;
    }

    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'cleancopy-trim-toast';
      document.documentElement.appendChild(toastEl);
    }

    clearTimeout(toastTimer);
    toastEl.innerHTML = `<span style="color: #10b981; font-weight: bold;">✓</span> <span>${msg}</span>`;
    toastEl.classList.add('visible');

    toastTimer = setTimeout(() => {
      if (toastEl) toastEl.classList.remove('visible');
    }, 1600);
  }

  // Listen to trimmed event from main world interceptor
  window.addEventListener('cleancopy-trimmed-notify', () => {
    displayToast('Trimmed ending space & newline');
  });
  window.addEventListener('cleandoc-trimmed-notify', () => {
    displayToast('Trimmed ending space & newline');
  });

  // Top frame receives forwarded toast from subframes (Google Docs or Wix Editor iframes)
  if (isTopFrame) {
    window.addEventListener('message', (e) => {
      if (e.data && (e.data.type === 'CLEANCOPY_FORWARD_TOAST' || e.data.type === 'CLEANDOC_FORWARD_TOAST')) {
        displayToast(e.data.message || 'Trimmed ending space & newline');
      }
    });
  }

  // Initial config sync
  syncConfigToPage();
})();
