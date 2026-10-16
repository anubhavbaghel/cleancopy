/**
 * CleanDoc Background Service Worker
 * Initializes default settings.
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({ enabled: true, showToast: true }, (current) => {
    chrome.storage.sync.set(current);
  });
});
