// extension/background.js

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === 'CAPTURED_MESSAGE') {
        console.log('[ScopeShield][BG] received CAPTURED_MESSAGE:', {
          message: msg.payload,
          from: sender?.tab?.url,
        });
        sendResponse({ ok: true });
        return;
      }

      if (msg?.type === 'SS_AUTH_STORE') {
        const ss_uid = msg?.payload?.ss_uid;

        if (typeof ss_uid !== 'string' || ss_uid.length === 0) {
          sendResponse({ ok: false, error: 'Invalid ss_uid' });
          return;
        }

        await chrome.storage.local.set({ ss_uid });

        console.log('[ScopeShield][BG] stored ss_uid:', ss_uid);

        // prove background can read it
        const stored = await chrome.storage.local.get(['ss_uid']);
        console.log('[ScopeShield][BG] readback ss_uid:', stored.ss_uid);

        sendResponse({ ok: true });
        return;
      }

      sendResponse({ ok: false, error: 'Unknown message type' });
    } catch (err) {
      console.error('[ScopeShield][BG] error handling message', err);
      sendResponse({ ok: false, error: 'Exception in background' });
    }
  })();

  // IMPORTANT: keep the message channel open for async sendResponse
  return true;
});
