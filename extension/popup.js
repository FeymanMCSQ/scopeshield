// -----------------------------
// Existing settings
// -----------------------------
const hourlyRateInput = document.getElementById('hourlyRate');
const defaultFeeInput = document.getElementById('defaultFee');
const saveBtn = document.getElementById('save');

// -----------------------------
// Template UI elements
// -----------------------------
const templateSelect = document.getElementById('templateSelect');
const templateTitleInput = document.getElementById('templateTitle');
const templateBodyInput = document.getElementById('templateBody');
const saveTemplateBtn = document.getElementById('saveTemplate');
const newTemplateBtn = document.getElementById('newTemplate');
const templateStatus = document.getElementById('templateStatus');

// -----------------------------
// Helpers
// -----------------------------
function uuid() {
  return crypto.randomUUID();
}

function setStatus(msg) {
  templateStatus.textContent = msg;
  setTimeout(() => (templateStatus.textContent = ''), 1200);
}

// -----------------------------
// Load base settings
// -----------------------------
chrome.storage.local.get(['hourlyRate', 'defaultFee'], (res) => {
  if (res.hourlyRate != null) hourlyRateInput.value = res.hourlyRate;
  if (res.defaultFee != null) defaultFeeInput.value = res.defaultFee;
});

// -----------------------------
// Save base settings
// -----------------------------
saveBtn.addEventListener('click', () => {
  const hourlyRate = Number(hourlyRateInput.value);
  const defaultFee = Number(defaultFeeInput.value);

  chrome.storage.local.set({ hourlyRate, defaultFee }, () => {
    saveBtn.textContent = 'Saved';
    setTimeout(() => (saveBtn.textContent = 'Save'), 800);
  });
});

// -----------------------------
// Templates logic
// -----------------------------

let templates = [];
let activeTemplateId = null;

function renderTemplateSelect() {
  templateSelect.innerHTML = '';

  templates.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.title || '(untitled)';
    templateSelect.appendChild(opt);
  });

  if (activeTemplateId) {
    templateSelect.value = activeTemplateId;
  }
}

function loadActiveTemplate() {
  const t = templates.find((x) => x.id === activeTemplateId);
  if (!t) return;

  templateTitleInput.value = t.title || '';
  templateBodyInput.value = t.body || '';
}

function loadTemplates() {
  chrome.storage.local.get(['templates', 'activeTemplateId'], (res) => {
    templates = Array.isArray(res.templates) ? res.templates : [];
    activeTemplateId = res.activeTemplateId || templates[0]?.id || null;

    renderTemplateSelect();
    loadActiveTemplate();
  });
}

// -----------------------------
// Template select change
// -----------------------------
templateSelect.addEventListener('change', () => {
  activeTemplateId = templateSelect.value;
  chrome.storage.local.set({ activeTemplateId });
  loadActiveTemplate();
});

// -----------------------------
// Save template
// -----------------------------
saveTemplateBtn.addEventListener('click', () => {
  if (!activeTemplateId) return;

  const idx = templates.findIndex((t) => t.id === activeTemplateId);
  if (idx === -1) return;

  templates[idx] = {
    ...templates[idx],
    title: templateTitleInput.value.trim(),
    body: templateBodyInput.value.trim(),
  };

  chrome.storage.local.set({ templates }, () => {
    renderTemplateSelect();
    setStatus('Template saved');
  });
});

// -----------------------------
// New template
// -----------------------------
newTemplateBtn.addEventListener('click', () => {
  const t = {
    id: uuid(),
    title: 'New template',
    body: 'Here’s the scope breakdown:\n{summary}\n\nLink: {link}\nPrice: {price}',
  };

  templates.push(t);
  activeTemplateId = t.id;

  chrome.storage.local.set({ templates, activeTemplateId }, () => {
    renderTemplateSelect();
    loadActiveTemplate();
    setStatus('New template created');
  });
});

// -----------------------------
// Init
// -----------------------------
loadTemplates();
