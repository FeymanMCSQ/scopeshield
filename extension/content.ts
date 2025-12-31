// extension/content.ts
import { captureMessageFromNode } from './messageCapture';
import { storeCapturedMessage } from './messageStore';

// Tell TS that the Chrome extension API exists in this environment.
// (You can also install @types/chrome for richer typing.)
declare const chrome: {
  runtime: {
    sendMessage: (
      message: unknown,
      callback?: (response: unknown) => void
    ) => void;
    lastError?: { message?: string };
  };
};

type MousePoint = { x: number; y: number };

(() => {
  const BTN_ID = 'scopeshield-btn';

  // Track mouse position as a fallback when selection rect is unreliable
  let lastMouse: MousePoint = { x: 0, y: 0 };

  document.addEventListener(
    'mousemove',
    (e: MouseEvent) => {
      lastMouse = { x: e.clientX, y: e.clientY };
    },
    { passive: true }
  );

  function ensureButton(): HTMLButtonElement {
    let btn = document.getElementById(BTN_ID) as HTMLButtonElement | null;
    if (btn) return btn;

    btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button'; // ✅ ok because it's HTMLButtonElement
    btn.innerHTML = `<span id="scopeshield-pill"></span><span>Shield</span>`;

    // Append to body (less likely to be stomped by SPA rerenders / CSS quirks)
    (document.body || document.documentElement).appendChild(btn);

    // Prevent selection collapse before click
    btn.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
    });

    btn.addEventListener('click', async () => {
      const text = getSelectedText();
      if (!text) return;

      const message = captureMessageFromNode({
        text,
        sender: 'Mock Sender', // placeholder
        timestamp: new Date().toISOString(),
        source: location.host.includes('slack') ? 'slack' : 'whatsapp',
      });

      storeCapturedMessage(message);
      console.log('[ScopeShield] Captured message:', message);

      // Send to background (service worker)
      chrome.runtime.sendMessage(
        { type: 'CAPTURED_MESSAGE', payload: message },
        (res: unknown) => {
          // if background is asleep/invalid, Chrome sets runtime.lastError
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

  function getSelectedText(): string {
    const sel = window.getSelection?.();
    if (!sel || sel.rangeCount === 0) return '';
    return sel.toString().trim();
  }

  function getSelectionRect(): DOMRect | null {
    const sel = window.getSelection?.();
    if (!sel || sel.rangeCount === 0) return null;

    const range = sel.getRangeAt(0);

    // Try bounding rect first
    const rect = range.getBoundingClientRect();
    if (rect && rect.width && rect.height) return rect;

    // Fallback to first client rect
    const rects = range.getClientRects();
    if (rects && rects.length) {
      const r = rects[0];
      if (r && r.width && r.height) return r;
    }

    return null;
  }

  function showButtonNearSelection(mouse: MousePoint) {
    const text = getSelectedText();
    if (!text) return hideButton();

    const btn = ensureButton();
    const rect = getSelectionRect();

    const padding = 10;

    // If rect is missing (common when page/selection is funky), fallback to mouse
    const baseX = rect ? rect.right + 8 : mouse.x + 8;
    const baseY = rect ? rect.top - 44 : mouse.y - 44;

    const x = Math.min(window.innerWidth - 140, Math.max(padding, baseX));
    const y = Math.min(window.innerHeight - 60, Math.max(padding, baseY));

    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
    btn.style.display = 'flex';
  }

  function hideButton() {
    const btn = document.getElementById(BTN_ID) as HTMLButtonElement | null;
    if (btn) btn.style.display = 'none';
  }

  // Only activate on WhatsApp/Slack to avoid accidental leakage
  const host = location.host;
  const supported =
    host === 'web.whatsapp.com' ||
    host === 'app.slack.com' ||
    host.endsWith('.slack.com');

  if (!supported) return;

  // Event wiring
  document.addEventListener('mouseup', () => {
    setTimeout(() => showButtonNearSelection(lastMouse), 0);
  });

  document.addEventListener('keyup', (e: KeyboardEvent) => {
    // selection via keyboard
    if (e.key === 'Shift' || e.key.startsWith('Arrow') || e.key === 'a') {
      setTimeout(() => showButtonNearSelection(lastMouse), 0);
    }
    // ESC hides
    if (e.key === 'Escape') hideButton();
  });

  // Click elsewhere hides (unless selection still exists)
  document.addEventListener('mousedown', (e: MouseEvent) => {
    const btn = document.getElementById(BTN_ID) as HTMLButtonElement | null;
    const targetNode = e.target instanceof Node ? e.target : null;

    if (btn && targetNode && targetNode !== btn && !btn.contains(targetNode)) {
      setTimeout(() => {
        if (!getSelectedText()) hideButton();
      }, 0);
    }
  });

  console.log('[ScopeShield] content script loaded:', location.href);
})();
