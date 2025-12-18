// extension/messageCapture.ts

export type CapturedMessage = {
  text: string;
  sender: string;
  timestamp: string;
  source: 'whatsapp' | 'slack' | 'unknown';
};

// extension/messageCapture.ts

export function captureMessageFromNode(opts: {
  text: string;
  sender?: string | null;
  timestamp?: string | null;
  source?: 'whatsapp' | 'slack';
}): CapturedMessage {
  return {
    text: opts.text.trim(),
    sender: opts.sender?.trim() || 'Unknown',
    timestamp: opts.timestamp || new Date().toISOString(),
    source: opts.source || 'unknown',
  };
}
