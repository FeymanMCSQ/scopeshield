// extension/ticket.ts

export type CapturedMessage = {
  text: string;
  sender: string;
  timestamp: string;
  source: 'whatsapp' | 'slack' | 'unknown';
};

export type Settings = {
  hourlyRate: number; // dollars per hour
  defaultFee: number; // dollars
};

export type Ticket = {
  id: string;
  createdAt: string;
  message: CapturedMessage;
  suggestion: {
    price: number; // dollars
    currency: 'USD';
    reason: string;
    confidence: 'low' | 'medium' | 'high';
  };
};

// Small deterministic id for now (stable in tests)
function makeId(text: string, timestamp: string) {
  const base = `${timestamp}::${text}`.slice(0, 80);
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) >>> 0;
  return `t_${h.toString(16)}`;
}

function includesAny(s: string, phrases: string[]) {
  return phrases.some((p) => s.includes(p));
}

export function suggestPriceFromMessage(
  messageText: string,
  settings: Settings
): Ticket['suggestion'] {
  const text = messageText.toLowerCase();

  // Keyword buckets (simple on purpose; you’ll evolve this later)
  const quickPhrases = [
    'quick tweak',
    'small tweak',
    'tiny change',
    'minor change',
    'quick fix',
  ];
  const urgentPhrases = ['urgent', 'asap', 'today', 'right now'];
  const heavyPhrases = [
    'redesign',
    'rebuild',
    'full rewrite',
    'major change',
    'new feature',
    'migration',
  ];

  // Rule 1: "quick tweak" class => fixed $50
  if (includesAny(text, quickPhrases)) {
    return {
      price: 50,
      currency: 'USD',
      reason: 'Matched quick-tweak keywords',
      confidence: 'high',
    };
  }

  // Rule 2: “urgent” bumps the default
  if (includesAny(text, urgentPhrases)) {
    const base = Number.isFinite(settings.defaultFee) ? settings.defaultFee : 0;
    const bumped = Math.max(0, Math.round(base * 1.5));
    return {
      price: bumped || 75, // fallback if defaultFee is 0/NaN
      currency: 'USD',
      reason: 'Urgency keywords detected (default fee x1.5)',
      confidence: 'medium',
    };
  }

  // Rule 3: “heavy” suggests a time-based minimum (1 hour)
  if (includesAny(text, heavyPhrases)) {
    const hr = Number.isFinite(settings.hourlyRate) ? settings.hourlyRate : 0;
    const price = Math.max(0, Math.round(hr)) || 150; // fallback if hourlyRate missing
    return {
      price,
      currency: 'USD',
      reason: 'Matched larger-scope keywords (1 hour minimum)',
      confidence: 'medium',
    };
  }

  // Default: use default fee (or $25 fallback)
  const df = Number.isFinite(settings.defaultFee) ? settings.defaultFee : 0;
  return {
    price: df || 25,
    currency: 'USD',
    reason: 'No specific keywords; using default fee',
    confidence: 'low',
  };
}

export function createTicketFromMessage(opts: {
  message: CapturedMessage;
  settings: Settings;
}): Ticket {
  const createdAt = new Date().toISOString();
  const suggestion = suggestPriceFromMessage(opts.message.text, opts.settings);

  return {
    id: makeId(opts.message.text, opts.message.timestamp),
    createdAt,
    message: opts.message,
    suggestion,
  };
}
