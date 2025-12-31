'use strict';
(() => {
  // extension/messageCapture.ts
  function captureMessageFromNode(opts) {
    return {
      text: opts.text.trim(),
      sender: opts.sender?.trim() || 'Unknown',
      timestamp: opts.timestamp || /* @__PURE__ */ new Date().toISOString(),
      source: opts.source || 'unknown',
    };
  }

  // extension/messageStore.ts
  var lastCaptured = null;
  function storeCapturedMessage(msg) {
    lastCaptured = msg;
  }

  // extension/content.ts
  (() => {
    const BTN_ID = 'scopeshield-btn';
    let lastMouse = { x: 0, y: 0 };
    document.addEventListener(
      'mousemove',
      (e) => {
        lastMouse = { x: e.clientX, y: e.clientY };
      },
      { passive: true }
    );
    function ensureButton() {
      let btn = document.getElementById(BTN_ID);
      if (btn) return btn;
      btn = document.createElement('button');
      btn.id = BTN_ID;
      btn.type = 'button';
      btn.innerHTML = `<span id="scopeshield-pill"></span><span>Shield</span>`;
      (document.body || document.documentElement).appendChild(btn);
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });
      btn.addEventListener('click', async () => {
        const text = getSelectedText();
        if (!text) return;
        const message = captureMessageFromNode({
          text,
          sender: 'Mock Sender',
          // placeholder
          timestamp: /* @__PURE__ */ new Date().toISOString(),
          source: location.host.includes('slack') ? 'slack' : 'whatsapp',
        });
        storeCapturedMessage(message);
        console.log('[ScopeShield] Captured message:', message);
        chrome.runtime.sendMessage(
          { type: 'CAPTURED_MESSAGE', payload: message },
          (res) => {
            const err = chrome.runtime.lastError;
            if (err) {
              console.warn('[ScopeShield] sendMessage failed:', err.message);
              return;
            }
            console.log('[ScopeShield] background ack:', res);
          }
        );
        hideButton();
      });
      return btn;
    }
    function getSelectedText() {
      const sel = window.getSelection?.();
      if (!sel || sel.rangeCount === 0) return '';
      return sel.toString().trim();
    }
    function getSelectionRect() {
      const sel = window.getSelection?.();
      if (!sel || sel.rangeCount === 0) return null;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect && rect.width && rect.height) return rect;
      const rects = range.getClientRects();
      if (rects && rects.length) {
        const r = rects[0];
        if (r && r.width && r.height) return r;
      }
      return null;
    }
    function showButtonNearSelection(mouse) {
      const text = getSelectedText();
      if (!text) return hideButton();
      const btn = ensureButton();
      const rect = getSelectionRect();
      const padding = 10;
      const baseX = rect ? rect.right + 8 : mouse.x + 8;
      const baseY = rect ? rect.top - 44 : mouse.y - 44;
      const x = Math.min(window.innerWidth - 140, Math.max(padding, baseX));
      const y = Math.min(window.innerHeight - 60, Math.max(padding, baseY));
      btn.style.left = `${x}px`;
      btn.style.top = `${y}px`;
      btn.style.display = 'flex';
    }
    function hideButton() {
      const btn = document.getElementById(BTN_ID);
      if (btn) btn.style.display = 'none';
    }
    const ORIGIN_ALLOWLIST = /* @__PURE__ */ new Set([
      'http://localhost:3000',
      'https://scopeshield.vercel.app',
    ]);
    function isSSAuthMessage(x) {
      if (!x || typeof x !== 'object') return false;
      const obj = x;
      return (
        obj.type === 'SS_AUTH' &&
        typeof obj.ss_uid === 'string' &&
        obj.ss_uid.length > 0
      );
    }
    window.addEventListener('message', (event) => {
      if (!ORIGIN_ALLOWLIST.has(event.origin)) return;
      if (!isSSAuthMessage(event.data)) return;
      chrome.runtime.sendMessage(
        { type: 'SS_AUTH_STORE', payload: { ss_uid: event.data.ss_uid } },
        (res) => {
          const err = chrome.runtime.lastError;
          if (err) {
            console.warn('[ScopeShield] SS_AUTH_STORE failed:', err.message);
            return;
          }
          console.log('[ScopeShield] SS_AUTH_STORE ack:', res);
        }
      );
    });

    // Listen for messages from Background Script
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'EXPAND_TEMPLATE') {
        console.log('[ScopeShield][Content] Expanding template:', msg.payload);
        // TODO: Implement actual text insertion logic here
        sendResponse({ ok: true });
        return;
      }
    });
    const host = location.host;
    const supported =
      host === 'web.whatsapp.com' ||
      host === 'app.slack.com' ||
      host.endsWith('.slack.com');
    if (!supported) return;
    document.addEventListener('mouseup', () => {
      setTimeout(() => showButtonNearSelection(lastMouse), 0);
    });
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Shift' || e.key.startsWith('Arrow') || e.key === 'a') {
        setTimeout(() => showButtonNearSelection(lastMouse), 0);
      }
      if (e.key === 'Escape') hideButton();
    });
    document.addEventListener('mousedown', (e) => {
      const btn = document.getElementById(BTN_ID);
      const targetNode = e.target instanceof Node ? e.target : null;
      if (
        btn &&
        targetNode &&
        targetNode !== btn &&
        !btn.contains(targetNode)
      ) {
        setTimeout(() => {
          if (!getSelectedText()) hideButton();
        }, 0);
      }
    });
    console.log('[ScopeShield] content script loaded:', location.href);
  })();
})();
