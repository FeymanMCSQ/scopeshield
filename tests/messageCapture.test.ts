import { captureMessageFromNode } from '../extension/messageCapture';

describe('captureMessageFromNode', () => {
  it('captures mock message data correctly', () => {
    const msg = captureMessageFromNode({
      text: ' Can you add this feature? ',
      sender: 'Alice',
      timestamp: '2025-01-01T12:00:00Z',
      source: 'slack',
    });

    expect(msg).toEqual({
      text: 'Can you add this feature?',
      sender: 'Alice',
      timestamp: '2025-01-01T12:00:00Z',
      source: 'slack',
    });
  });
});
