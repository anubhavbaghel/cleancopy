/**
 * CleanDoc Popup Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const enabledEl = document.getElementById('enabled');
  const showToastEl = document.getElementById('showToast');
  const statusCard = document.getElementById('status-card');
  const statusText = document.getElementById('status-text');
  const testInput = document.getElementById('test-input');

  function updateStatusUI(isEnabled) {
    if (isEnabled) {
      statusCard.className = 'status-card active';
      statusText.textContent = 'Active: Trimming ending spaces on copy';
    } else {
      statusCard.className = 'status-card disabled';
      statusText.textContent = 'Disabled: Normal browser copy';
    }
  }

  // Load saved settings
  chrome.storage.sync.get({ enabled: true, showToast: true }, (saved) => {
    const isEnabled = saved.enabled !== false;
    enabledEl.checked = isEnabled;
    showToastEl.checked = saved.showToast !== false;
    updateStatusUI(isEnabled);
  });

  // Handle master toggle change
  enabledEl.addEventListener('change', () => {
    const isEnabled = enabledEl.checked;
    chrome.storage.sync.set({ enabled: isEnabled });
    updateStatusUI(isEnabled);
  });

  // Handle toast notification preference
  showToastEl.addEventListener('change', () => {
    chrome.storage.sync.set({ showToast: showToastEl.checked });
  });

  // Auto-select text when clicking test box for easy testing
  if (testInput) {
    testInput.addEventListener('click', () => {
      testInput.select();
    });
  }

  // Test Box Copy Interceptor inside popup
  document.addEventListener('copy', (e) => {
    if (!enabledEl.checked) return;

    let textToCopy = '';

    // Handle input field selection (selectionStart/selectionEnd)
    if (document.activeElement === testInput && testInput) {
      const start = testInput.selectionStart;
      const end = testInput.selectionEnd;
      textToCopy = (start !== end) ? testInput.value.substring(start, end) : testInput.value;
    } else {
      textToCopy = window.getSelection() ? window.getSelection().toString() : '';
    }

    if (textToCopy && e.clipboardData) {
      const trimmed = textToCopy.replace(/[\s\u00A0]+$/, '');
      if (trimmed !== textToCopy) {
        e.clipboardData.setData('text/plain', trimmed);
        e.preventDefault();

        // Immediate visual feedback inside popup
        statusCard.className = 'status-card active';
        statusText.innerHTML = '<span style="color: #34d399; font-weight: bold;">✓ Trimmed ending space!</span> Ready to paste.';
        setTimeout(() => {
          updateStatusUI(enabledEl.checked);
        }, 2000);
      }
    }
  });
});
