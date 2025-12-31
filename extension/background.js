// extension/background.js

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  try {
    if (msg?.type === 'CAPTURED_MESSAGE') {
      console.log('[ScopeShield][BG] received CAPTURED_MESSAGE:', {
        message: msg.payload,
        from: sender?.tab?.url,
      });

      // Always respond so content script can confirm delivery
      sendResponse({ ok: true });
      return; // sync response
    }

    // Unknown message type
    sendResponse({ ok: false, error: 'Unknown message type' });
    return;
  } catch (err) {
    console.error('[ScopeShield][BG] error handling message', err);
    sendResponse({ ok: false, error: 'Exception in background' });
    return;
  }
});
