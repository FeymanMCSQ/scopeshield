import { normalizeSettings } from '../extension/settings';

describe('settings normalization', () => {
  it('normalizes stored values correctly', () => {
    const settings = normalizeSettings({
      hourlyRate: '80',
      defaultFee: 25,
    });

    expect(settings).toEqual({
      hourlyRate: 80,
      defaultFee: 25,
    });
  });
});
