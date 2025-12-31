// // -----------------------------
// // Existing settings
// // -----------------------------
// const hourlyRateInput = document.getElementById('hourlyRate');
// const defaultFeeInput = document.getElementById('defaultFee');
// const saveBtn = document.getElementById('save');

// // -----------------------------
// // Template UI elements
// // -----------------------------
// const templateSelect = document.getElementById('templateSelect');
// const templateTitleInput = document.getElementById('templateTitle');
// const templateBodyInput = document.getElementById('templateBody');
// const saveTemplateBtn = document.getElementById('saveTemplate');
// const newTemplateBtn = document.getElementById('newTemplate');
// const templateStatus = document.getElementById('templateStatus');

// // -----------------------------
// // Helpers
// // -----------------------------
// function uuid() {
//   return crypto.randomUUID();
// }

// function setStatus(msg) {
//   templateStatus.textContent = msg;
//   setTimeout(() => (templateStatus.textContent = ''), 1200);
// }

// // -----------------------------
// // Load base settings
// // -----------------------------
// chrome.storage.local.get(['hourlyRate', 'defaultFee'], (res) => {
//   if (res.hourlyRate != null) hourlyRateInput.value = res.hourlyRate;
//   if (res.defaultFee != null) defaultFeeInput.value = res.defaultFee;
// });

// // -----------------------------
// // Save base settings
// // -----------------------------
// saveBtn.addEventListener('click', () => {
//   const hourlyRate = Number(hourlyRateInput.value);
//   const defaultFee = Number(defaultFeeInput.value);

//   chrome.storage.local.set({ hourlyRate, defaultFee }, () => {
//     saveBtn.textContent = 'Saved';
//     setTimeout(() => (saveBtn.textContent = 'Save'), 800);
//   });
// });

// // -----------------------------
// // Templates logic
// // -----------------------------

// let templates = [];
// let activeTemplateId = null;

// function renderTemplateSelect() {
//   templateSelect.innerHTML = '';

//   templates.forEach((t) => {
//     const opt = document.createElement('option');
//     opt.value = t.id;
//     opt.textContent = t.title || '(untitled)';
//     templateSelect.appendChild(opt);
//   });

//   if (activeTemplateId) {
//     templateSelect.value = activeTemplateId;
//   }
// }

// function loadActiveTemplate() {
//   const t = templates.find((x) => x.id === activeTemplateId);
//   if (!t) return;

//   templateTitleInput.value = t.title || '';
//   templateBodyInput.value = t.body || '';
// }

// function loadTemplates() {
//   chrome.storage.local.get(['templates', 'activeTemplateId'], (res) => {
//     templates = Array.isArray(res.templates) ? res.templates : [];
//     activeTemplateId = res.activeTemplateId || templates[0]?.id || null;

//     renderTemplateSelect();
//     loadActiveTemplate();
//   });
// }

// // -----------------------------
// // Template select change
// // -----------------------------
// templateSelect.addEventListener('change', () => {
//   activeTemplateId = templateSelect.value;
//   chrome.storage.local.set({ activeTemplateId });
//   loadActiveTemplate();
// });

// // -----------------------------
// // Save template
// // -----------------------------
// saveTemplateBtn.addEventListener('click', () => {
//   if (!activeTemplateId) return;

//   const idx = templates.findIndex((t) => t.id === activeTemplateId);
//   if (idx === -1) return;

//   templates[idx] = {
//     ...templates[idx],
//     title: templateTitleInput.value.trim(),
//     body: templateBodyInput.value.trim(),
//   };

//   chrome.storage.local.set({ templates }, () => {
//     renderTemplateSelect();
//     setStatus('Template saved');
//   });
// });

// // -----------------------------
// // New template
// // -----------------------------
// newTemplateBtn.addEventListener('click', () => {
//   const t = {
//     id: uuid(),
//     title: 'New template',
//     body: 'Here’s the scope breakdown:\n{summary}\n\nLink: {link}\nPrice: {price}',
//   };

//   templates.push(t);
//   activeTemplateId = t.id;

//   chrome.storage.local.set({ templates, activeTemplateId }, () => {
//     renderTemplateSelect();
//     loadActiveTemplate();
//     setStatus('New template created');
//   });
// });

// // -----------------------------
// // Init
// // -----------------------------
// loadTemplates();

// -----------------------------
// Base settings UI
// -----------------------------
const hourlyRateInput = document.getElementById('hourlyRate');
const defaultFeeInput = document.getElementById('defaultFee');
const saveBtn = document.getElementById('save');

// -----------------------------
// Latest reply (NEW UI)
// -----------------------------
const latestReplyEl = document.getElementById('latestReply');
const copyReplyBtn = document.getElementById('copyReply');
const openTicketBtn = document.getElementById('openTicket');
const replyMetaEl = document.getElementById('replyMeta');

// -----------------------------
// Template UI
// -----------------------------
const templateSelect = document.getElementById('templateSelect');
const templateTitleInput = document.getElementById('templateTitle');
const templateBodyInput = document.getElementById('templateBody');
const saveTemplateBtn = document.getElementById('saveTemplate');
const newTemplateBtn = document.getElementById('newTemplate');
const templateStatus = document.getElementById('templateStatus');

// -----------------------------
// Storage keys (MUST match background.js)
// -----------------------------
const TEMPLATE_KEYS = ['replyTemplates', 'selectedTemplateId'];
const LAST_REPLY_KEY = 'lastReply';

// -----------------------------
// Helpers
// -----------------------------
function uuid() {
  return crypto.randomUUID();
}

function safeStr(v) {
  return v == null ? '' : String(v);
}

function setTemplateStatus(msg) {
  templateStatus.textContent = msg;
  window.setTimeout(() => (templateStatus.textContent = ''), 1400);
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  } catch {
    return '';
  }
}

async function copyToClipboard(text) {
  // Prefer async clipboard API; fallback for older contexts
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

// -----------------------------
// Load + Save base settings
// -----------------------------
chrome.storage.local.get(['hourlyRate', 'defaultFee'], (res) => {
  if (res.hourlyRate != null) hourlyRateInput.value = res.hourlyRate;
  if (res.defaultFee != null) defaultFeeInput.value = res.defaultFee;
});

saveBtn.addEventListener('click', () => {
  const hourlyRate = Number(hourlyRateInput.value);
  const defaultFee = Number(defaultFeeInput.value);

  chrome.storage.local.set({ hourlyRate, defaultFee }, () => {
    saveBtn.textContent = 'Saved';
    window.setTimeout(() => (saveBtn.textContent = 'Save'), 800);
  });
});

// -----------------------------
// Templates logic (V1)
// Uses: replyTemplates + selectedTemplateId
// -----------------------------
let templates = [];
let selectedTemplateId = null;

function renderTemplateSelect() {
  templateSelect.innerHTML = '';

  templates.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.title || '(untitled)';
    templateSelect.appendChild(opt);
  });

  if (selectedTemplateId) {
    templateSelect.value = selectedTemplateId;
  }
}

function loadSelectedTemplateIntoEditor() {
  const t = templates.find((x) => x.id === selectedTemplateId);
  if (!t) {
    templateTitleInput.value = '';
    templateBodyInput.value = '';
    return;
  }

  templateTitleInput.value = t.title || '';
  templateBodyInput.value = t.body || '';
}

function loadTemplates() {
  chrome.storage.local.get(TEMPLATE_KEYS, (res) => {
    templates = Array.isArray(res.replyTemplates) ? res.replyTemplates : [];
    selectedTemplateId =
      typeof res.selectedTemplateId === 'string' && res.selectedTemplateId
        ? res.selectedTemplateId
        : templates[0]?.id || null;

    // If we have templates but no selectedTemplateId stored, persist it
    if (templates.length && res.selectedTemplateId !== selectedTemplateId) {
      chrome.storage.local.set({ selectedTemplateId });
    }

    renderTemplateSelect();
    loadSelectedTemplateIntoEditor();
  });
}

templateSelect.addEventListener('change', () => {
  selectedTemplateId = templateSelect.value;
  chrome.storage.local.set({ selectedTemplateId }, () => {
    loadSelectedTemplateIntoEditor();
    setTemplateStatus('Selected');
  });
});

saveTemplateBtn.addEventListener('click', () => {
  if (!selectedTemplateId) return;

  const idx = templates.findIndex((t) => t.id === selectedTemplateId);
  if (idx === -1) return;

  templates[idx] = {
    ...templates[idx],
    title: templateTitleInput.value.trim(),
    body: templateBodyInput.value.trim(),
  };

  chrome.storage.local.set({ replyTemplates: templates }, () => {
    renderTemplateSelect();
    setTemplateStatus('Template saved');
  });
});

newTemplateBtn.addEventListener('click', () => {
  const t = {
    id: uuid(),
    title: 'New template',
    body: 'Here’s the change request:\n{link}\n\nSummary: {summary}\nPrice: {price}\nClient: {client}',
  };

  templates.push(t);
  selectedTemplateId = t.id;

  chrome.storage.local.set(
    { replyTemplates: templates, selectedTemplateId },
    () => {
      renderTemplateSelect();
      loadSelectedTemplateIntoEditor();
      setTemplateStatus('New template created');
    }
  );
});

// -----------------------------
// Latest reply logic (V1)
// Uses: lastReply stored by background.js after CAPTURED_MESSAGE
// -----------------------------
let lastTicketUrl = '';

function renderLastReply(lastReply) {
  if (!lastReply || typeof lastReply !== 'object') {
    latestReplyEl.value = '';
    replyMetaEl.textContent =
      'No reply yet. Select a message in WhatsApp and click Shield.';
    openTicketBtn.disabled = true;
    lastTicketUrl = '';
    return;
  }

  const text = safeStr(lastReply.text);
  latestReplyEl.value = text;

  const createdAt = safeStr(lastReply.createdAt);
  const when = createdAt ? formatTime(createdAt) : '';
  const tplTitle = safeStr(lastReply?.template?.title);
  const ticketUrl = safeStr(lastReply.ticketUrl);

  lastTicketUrl = ticketUrl;

  const parts = [];
  if (when) parts.push(`Saved: ${when}`);
  if (tplTitle) parts.push(`Template: ${tplTitle}`);
  if (ticketUrl) parts.push(`Ticket: ${ticketUrl}`);

  replyMetaEl.innerHTML = parts.length
    ? `<div class="mono">${parts.join(' • ')}</div>`
    : '';

  openTicketBtn.disabled = !ticketUrl;
}

function loadLastReply() {
  chrome.storage.local.get([LAST_REPLY_KEY], (res) => {
    renderLastReply(res.lastReply);
  });
}

copyReplyBtn.addEventListener('click', async () => {
  const text = safeStr(latestReplyEl.value).trim();
  if (!text) {
    replyMetaEl.textContent = 'Nothing to copy yet.';
    window.setTimeout(() => loadLastReply(), 800);
    return;
  }

  const ok = await copyToClipboard(text);
  replyMetaEl.textContent = ok ? 'Copied ✅' : 'Copy failed ❌';
  window.setTimeout(() => loadLastReply(), 900);
});

openTicketBtn.addEventListener('click', () => {
  if (!lastTicketUrl) return;
  chrome.tabs.create({ url: lastTicketUrl });
});

// Optional: keep popup in sync if lastReply updates while popup is open
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes[LAST_REPLY_KEY]) loadLastReply();
  if (changes.replyTemplates || changes.selectedTemplateId) loadTemplates();
});

// -----------------------------
// Init
// -----------------------------
loadTemplates();
loadLastReply();
