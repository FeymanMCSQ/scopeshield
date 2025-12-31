// // extension/background.js

// // ---- Templates V1 ----
// const TEMPLATE_KEYS = ['replyTemplates', 'selectedTemplateId'];

// const DEFAULT_TEMPLATES = [
//   {
//     id: 'tpl-brief',
//     title: 'Brief + direct',
//     body: 'Done — I’ve captured this as a change request.\n\nLink: {link}\nPrice: {price}\n\nPlease approve and I’ll proceed.',
//   },
//   {
//     id: 'tpl-friendly',
//     title: 'Friendly + clear',
//     body: 'No worries — I can add that.\n\nHere’s the change request: {link}\nEstimated price: {price}\n\nOnce you approve it, I’ll get started.',
//   },
//   {
//     id: 'tpl-summary',
//     title: 'With summary',
//     body: 'Got it. I’ve logged this as a change request.\n\nSummary: {summary}\nLink: {link}\nPrice: {price}\nClient: {client}\n\nApprove when ready 👍',
//   },
// ];

// function safeStr(v) {
//   return v == null ? '' : String(v);
// }

// function expandTemplate(body, vars) {
//   const b = safeStr(body);
//   const v = vars || {};
//   return b
//     .replaceAll('{link}', safeStr(v.link))
//     .replaceAll('{price}', safeStr(v.price))
//     .replaceAll('{client}', safeStr(v.client))
//     .replaceAll('{summary}', safeStr(v.summary));
// }

// async function ensureTemplatesSeeded() {
//   const stored = await chrome.storage.local.get(TEMPLATE_KEYS);
//   const templates = Array.isArray(stored.replyTemplates)
//     ? stored.replyTemplates
//     : [];

//   if (templates.length > 0) return;

//   await chrome.storage.local.set({
//     replyTemplates: DEFAULT_TEMPLATES,
//     selectedTemplateId: DEFAULT_TEMPLATES[0].id,
//   });

//   console.log('[ScopeShield][BG] seeded default reply templates');
// }

// async function getSelectedTemplateOr(id) {
//   const stored = await chrome.storage.local.get(TEMPLATE_KEYS);
//   const templates = Array.isArray(stored.replyTemplates)
//     ? stored.replyTemplates
//     : [];

//   const selectedId =
//     typeof id === 'string' && id
//       ? id
//       : typeof stored.selectedTemplateId === 'string'
//       ? stored.selectedTemplateId
//       : null;

//   const tpl = templates.find((t) => t && t.id === selectedId);
//   return tpl || null;
// }

// chrome.runtime.onInstalled?.addListener(() => {
//   void ensureTemplatesSeeded();
// });

// // Keep the SW warm to seed on first message as well (covers dev reloads)
// void ensureTemplatesSeeded();

// chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
//   (async () => {
//     try {
//       // -----------------------------
//       // 0) Templates: expand into final reply string
//       // -----------------------------
//       if (msg?.type === 'EXPAND_TEMPLATE') {
//         await ensureTemplatesSeeded();

//         const templateId = msg?.payload?.templateId;
//         const vars = msg?.payload?.vars ?? {};

//         const tpl = await getSelectedTemplateOr(templateId);
//         if (!tpl) {
//           sendResponse({ ok: false, error: 'template not found' });
//           return;
//         }

//         const body = typeof tpl.body === 'string' ? tpl.body : '';
//         const result = expandTemplate(body, vars);

//         console.log('[ScopeShield][BG] expanded template:', {
//           templateId: tpl.id,
//           title: tpl.title,
//           result,
//         });

//         sendResponse({
//           ok: true,
//           result,
//           template: { id: tpl.id, title: tpl.title },
//         });
//         return;
//       }

//       // -----------------------------
//       // 1) Pairing: store ss_uid
//       // -----------------------------
//       if (msg?.type === 'SS_AUTH_STORE') {
//         const ss_uid = msg?.payload?.ss_uid;

//         if (typeof ss_uid !== 'string' || ss_uid.trim().length === 0) {
//           sendResponse({ ok: false, error: 'Invalid ss_uid' });
//           return;
//         }

//         await chrome.storage.local.set({ ss_uid });

//         console.log('[ScopeShield][BG] stored ss_uid:', ss_uid);

//         // prove background can read it
//         const stored = await chrome.storage.local.get(['ss_uid']);
//         console.log('[ScopeShield][BG] readback ss_uid:', stored.ss_uid);

//         sendResponse({ ok: true });
//         return;
//       }

//       // -----------------------------
//       // 2) Capture: create ticket via API
//       // -----------------------------
//       if (msg?.type === 'CAPTURED_MESSAGE') {
//         const captured = msg.payload;

//         console.log('[ScopeShield][BG] received CAPTURED_MESSAGE:', {
//           message: captured,
//           from: sender?.tab?.url,
//         });

//         // Load paired identity
//         const { ss_uid } = await chrome.storage.local.get(['ss_uid']);
//         if (!ss_uid) {
//           console.warn(
//             '[ScopeShield][BG] No ss_uid paired yet. Open dashboard to pair.'
//           );
//           sendResponse({ ok: false, error: 'not paired' });
//           return;
//         }

//         // Build request body (MVP defaults)
//         const messageText =
//           typeof captured?.text === 'string'
//             ? captured.text
//             : typeof captured?.message === 'string'
//             ? captured.message
//             : typeof captured === 'string'
//             ? captured
//             : '';

//         if (!messageText.trim()) {
//           sendResponse({ ok: false, error: 'empty message' });
//           return;
//         }

//         const body = {
//           message: messageText.trim(),
//           priceDollars: 0,
//           clientName: 'Default Client',
//         };

//         try {
//           const res = await fetch('http://localhost:3000/api/create-ticket', {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'X-SS-UID': ss_uid,
//             },
//             body: JSON.stringify(body),
//           });

//           let data = {};
//           try {
//             data = await res.json();
//           } catch {
//             // ignore JSON parse issues
//           }

//           if (!res.ok) {
//             console.error(
//               '[ScopeShield][BG] create-ticket failed:',
//               res.status,
//               data
//             );
//             sendResponse({
//               ok: false,
//               error: 'create-ticket failed',
//               status: res.status,
//               data,
//             });
//             return;
//           }

//           console.log('[ScopeShield][BG] created ticket:', data); // { ticketId, url }
//           sendResponse({ ok: true, ticket: data });
//           return;
//         } catch (err) {
//           console.error('[ScopeShield][BG] create-ticket exception:', err);
//           sendResponse({ ok: false, error: 'network error' });
//           return;
//         }
//       }

//       // -----------------------------
//       // Fallback
//       // -----------------------------
//       sendResponse({ ok: false, error: 'Unknown message type' });
//     } catch (err) {
//       console.error('[ScopeShield][BG] error handling message', err);
//       sendResponse({ ok: false, error: 'Exception in background' });
//     }
//   })();

//   // IMPORTANT: keep the message channel open for async sendResponse
//   return true;
// });

// extension/background.js

// ---- Templates V1 ----
const TEMPLATE_KEYS = ['replyTemplates', 'selectedTemplateId'];

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-brief',
    title: 'Brief + direct',
    body: 'Done — I’ve captured this as a change request.\n\nLink: {link}\nPrice: {price}\n\nPlease approve and I’ll proceed.',
  },
  {
    id: 'tpl-friendly',
    title: 'Friendly + clear',
    body: 'No worries — I can add that.\n\nHere’s the change request: {link}\nEstimated price: {price}\n\nOnce you approve it, I’ll get started.',
  },
  {
    id: 'tpl-summary',
    title: 'With summary',
    body: 'Got it. I’ve logged this as a change request.\n\nSummary: {summary}\nLink: {link}\nPrice: {price}\nClient: {client}\n\nApprove when ready 👍',
  },
];

function safeStr(v) {
  return v == null ? '' : String(v);
}

function expandTemplate(body, vars) {
  const b = safeStr(body);
  const v = vars || {};
  return b
    .replaceAll('{link}', safeStr(v.link))
    .replaceAll('{price}', safeStr(v.price))
    .replaceAll('{client}', safeStr(v.client))
    .replaceAll('{summary}', safeStr(v.summary))
    .trim();
}

async function ensureTemplatesSeeded() {
  const stored = await chrome.storage.local.get(TEMPLATE_KEYS);
  const templates = Array.isArray(stored.replyTemplates)
    ? stored.replyTemplates
    : [];

  if (templates.length > 0) return;

  await chrome.storage.local.set({
    replyTemplates: DEFAULT_TEMPLATES,
    selectedTemplateId: DEFAULT_TEMPLATES[0].id,
  });

  console.log('[ScopeShield][BG] seeded default reply templates');
}

async function getSelectedTemplateOr(id) {
  const stored = await chrome.storage.local.get(TEMPLATE_KEYS);
  const templates = Array.isArray(stored.replyTemplates)
    ? stored.replyTemplates
    : [];

  const selectedId =
    typeof id === 'string' && id
      ? id
      : typeof stored.selectedTemplateId === 'string' &&
        stored.selectedTemplateId
      ? stored.selectedTemplateId
      : null;

  const tpl = templates.find((t) => t && t.id === selectedId);
  return tpl || null;
}

chrome.runtime.onInstalled?.addListener(() => {
  void ensureTemplatesSeeded();
});

// Covers dev reloads where onInstalled doesn't re-run
void ensureTemplatesSeeded();

async function expandUsingStoredTemplate(templateId, vars) {
  await ensureTemplatesSeeded();

  const tpl = await getSelectedTemplateOr(templateId);
  if (!tpl) {
    return {
      ok: false,
      error: 'template not found',
    };
  }

  const body = typeof tpl.body === 'string' ? tpl.body : '';
  const result = expandTemplate(body, vars);

  return {
    ok: true,
    result,
    template: { id: tpl.id, title: tpl.title },
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      // -----------------------------
      // 0) Templates: expand into final reply string
      // -----------------------------
      if (msg?.type === 'EXPAND_TEMPLATE') {
        const templateId = msg?.payload?.templateId;
        const vars = msg?.payload?.vars ?? {};

        const expanded = await expandUsingStoredTemplate(templateId, vars);

        if (!expanded.ok) {
          sendResponse(expanded);
          return;
        }

        console.log('[ScopeShield][BG] expanded template:', {
          templateId: expanded.template.id,
          title: expanded.template.title,
          result: expanded.result,
        });

        sendResponse(expanded);
        return;
      }

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
      // 2) Capture: create ticket via API -> expand template -> store lastReply
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

        // Extract message text
        const summary =
          typeof captured?.text === 'string'
            ? captured.text
            : typeof captured?.message === 'string'
            ? captured.message
            : typeof captured === 'string'
            ? captured
            : '';

        const summaryTrimmed = summary.trim();
        if (!summaryTrimmed) {
          sendResponse({ ok: false, error: 'empty message' });
          return;
        }

        // MVP defaults (later: pricing logic from stored hourlyRate/defaultFee)
        const clientName = 'Default Client';
        const priceDollars = 0;

        const body = {
          message: summaryTrimmed,
          priceDollars,
          clientName,
        };

        // 2.1 Create ticket
        let ticketData = null;

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
            // ignore
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

          ticketData = data;
          console.log('[ScopeShield][BG] created ticket:', ticketData);
        } catch (err) {
          console.error('[ScopeShield][BG] create-ticket exception:', err);
          sendResponse({ ok: false, error: 'network error' });
          return;
        }

        // 2.2 Expand reply template
        const ticketUrl = safeStr(ticketData?.url);
        const ticketId = safeStr(ticketData?.ticketId);
        const publicId = safeStr(ticketData?.publicId);

        const vars = {
          link: ticketUrl || '(link unavailable)',
          price: `$${priceDollars.toFixed(2)}`,
          client: clientName,
          summary: summaryTrimmed,
        };

        const expanded = await expandUsingStoredTemplate(null, vars);

        // Fallback if template expansion fails (shouldn't, but safety)
        const replyText = expanded.ok
          ? expanded.result
          : `Done — I’ve captured this as a change request.\n\nLink: ${vars.link}\nPrice: ${vars.price}\n\nPlease approve and I’ll proceed.`;

        // 2.3 Store lastReply for popup
        const lastReply = {
          text: replyText,
          ticketUrl: ticketUrl,
          ticketId,
          publicId,
          createdAt: new Date().toISOString(),
          template: expanded.ok ? expanded.template : null,
          vars,
        };

        await chrome.storage.local.set({ lastReply });

        console.log('[ScopeShield][BG] stored lastReply:', lastReply);

        // 2.4 Respond with both ticket + lastReply
        sendResponse({
          ok: true,
          ticket: ticketData,
          lastReply,
        });
        return;
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
