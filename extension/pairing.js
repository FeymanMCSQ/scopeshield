"use strict";
(() => {
  // extension/pairing.ts
  var ORIGIN_ALLOWLIST = /* @__PURE__ */ new Set([
    "http://localhost:3000",
    "https://scopeshield.vercel.app"
  ]);
  function isSSAuthMessage(x) {
    if (!x || typeof x !== "object") return false;
    const obj = x;
    return obj.type === "SS_AUTH" && typeof obj.ss_uid === "string" && obj.ss_uid.length > 0;
  }
  window.addEventListener("message", (event) => {
    if (!ORIGIN_ALLOWLIST.has(event.origin)) return;
    if (!isSSAuthMessage(event.data)) return;
    chrome.runtime.sendMessage(
      { type: "SS_AUTH_STORE", payload: { ss_uid: event.data.ss_uid } },
      (res) => {
        const err = chrome.runtime.lastError;
        if (err) {
          console.warn("[ScopeShield][pairing] store failed:", err.message);
          return;
        }
        console.log("[ScopeShield][pairing] stored:", res);
      }
    );
  });
  console.log("[ScopeShield][pairing] loaded on", location.href);
})();
