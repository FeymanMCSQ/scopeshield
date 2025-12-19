import { createTicketFromMessage } from '../extension/ticket';

describe('ticket generation util', () => {
  it('"quick tweak" suggests $50 and returns JSON', () => {
    const ticket = createTicketFromMessage({
      message: {
        text: 'Can you make a quick tweak to the logo?',
        sender: 'Alice',
        timestamp: '2025-01-01T12:00:00Z',
        source: 'slack',
      },
      settings: { hourlyRate: 100, defaultFee: 25 },
    });

    expect(ticket.suggestion.price).toBe(50);
    expect(ticket.suggestion.reason).toMatch(/quick-tweak/i);

    // JSON check
    expect(() => JSON.stringify(ticket)).not.toThrow();
  });
});
