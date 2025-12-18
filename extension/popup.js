const hourlyRateInput = document.getElementById('hourlyRate');
const defaultFeeInput = document.getElementById('defaultFee');
const saveBtn = document.getElementById('save');

// Load existing settings
chrome.storage.local.get(['hourlyRate', 'defaultFee'], (res) => {
  if (res.hourlyRate != null) hourlyRateInput.value = res.hourlyRate;
  if (res.defaultFee != null) defaultFeeInput.value = res.defaultFee;
});

// Save settings
saveBtn.addEventListener('click', () => {
  const hourlyRate = Number(hourlyRateInput.value);
  const defaultFee = Number(defaultFeeInput.value);

  chrome.storage.local.set({ hourlyRate, defaultFee }, () => {
    saveBtn.textContent = 'Saved';
    setTimeout(() => (saveBtn.textContent = 'Save'), 800);
  });
});
