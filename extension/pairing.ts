// extension/pairing.ts

declare const chrome: {
  runtime: {
    sendMessage: (
      message: unknown,
      callback?: (response: unknown) => void
    ) => void;
    lastError?: { message?: string };
  };
};

const ORIGIN_ALLOWLIST = new Set([
  'http://localhost:3000',
  'https://scopeshield.vercel.app',
]);

type SSAuthMessage = {
  type: 'SS_AUTH';
  ss_uid: string;
};

function isSSAuthMessage(x: unknown): x is SSAuthMessage {
  if (!x || typeof x !== 'object') return false;
  const obj = x as Record<string, unknown>;
  return (
    obj.type === 'SS_AUTH' &&
    typeof obj.ss_uid === 'string' &&
    obj.ss_uid.length > 0
  );
}

window.addEventListener('message', (event: MessageEvent) => {
  if (!ORIGIN_ALLOWLIST.has(event.origin)) return;
  if (!isSSAuthMessage(event.data)) return;

  chrome.runtime.sendMessage(
    { type: 'SS_AUTH_STORE', payload: { ss_uid: event.data.ss_uid } },
    (res: unknown) => {
      const err = chrome.runtime.lastError;
      if (err) {
        console.warn('[ScopeShield][pairing] store failed:', err.message);
        return;
      }
      console.log('[ScopeShield][pairing] stored:', res);
    }
  );
});

console.log('[ScopeShield][pairing] loaded on', location.href);
