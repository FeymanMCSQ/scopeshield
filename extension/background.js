// extension/background.js

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      // -----------------------------
      // 1) Pairing: store ss_uid
      // -----------------------------
      if (msg?.type === 'SS_AUTH_STORE') {
        const ss_uid = msg?.payload?.ss_uid;

        if (typeof ss_uid !== 'string' || ss_uid.trim().length === 0) {
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

      // -----------------------------
      // 2) Capture: create ticket via API
      // -----------------------------
      if (msg?.type === 'CAPTURED_MESSAGE') {
        const captured = msg.payload;

        console.log('[ScopeShield][BG] received CAPTURED_MESSAGE:', {
          message: captured,
          from: sender?.tab?.url,
        });

        // Load paired identity
        const { ss_uid } = await chrome.storage.local.get(['ss_uid']);
        if (!ss_uid) {
          console.warn(
            '[ScopeShield][BG] No ss_uid paired yet. Open dashboard to pair.'
          );
          sendResponse({ ok: false, error: 'not paired' });
          return;
        }

        // Build request body (MVP defaults)
        const messageText =
          typeof captured?.text === 'string'
            ? captured.text
            : typeof captured?.message === 'string'
            ? captured.message
            : typeof captured === 'string'
            ? captured
            : '';

        if (!messageText.trim()) {
          sendResponse({ ok: false, error: 'empty message' });
          return;
        }

        const body = {
          message: messageText.trim(),
          priceDollars: 0,
          clientName: 'Default Client',
        };

        try {
          const res = await fetch('http://localhost:3000/api/create-ticket', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-SS-UID': ss_uid,
            },
            body: JSON.stringify(body),
          });

          let data = {};
          try {
            data = await res.json();
          } catch {
            // ignore JSON parse issues
          }

          if (!res.ok) {
            console.error(
              '[ScopeShield][BG] create-ticket failed:',
              res.status,
              data
            );
            sendResponse({
              ok: false,
              error: 'create-ticket failed',
              status: res.status,
              data,
            });
            return;
          }

          console.log('[ScopeShield][BG] created ticket:', data); // { ticketId, url }
          sendResponse({ ok: true, ticket: data });
          return;
        } catch (err) {
          console.error('[ScopeShield][BG] create-ticket exception:', err);
          sendResponse({ ok: false, error: 'network error' });
          return;
        }
      }

      // -----------------------------
      // Fallback
      // -----------------------------
      sendResponse({ ok: false, error: 'Unknown message type' });
    } catch (err) {
      console.error('[ScopeShield][BG] error handling message', err);
      sendResponse({ ok: false, error: 'Exception in background' });
    }
  })();

  // IMPORTANT: keep the message channel open for async sendResponse
  return true;
});
