import { describe, expect, it } from 'vitest';
import { straightLineEstimator } from '@/lib/geo/travel';
import { makeResort } from '@/lib/test-fixtures';

describe('straightLineEstimator', () => {
  it('returns straight-line miles and no minutes', async () => {
    const killington = makeResort({ id: 'killington', location: { state: 'VT', lat: 43.6262, lng: -72.7967 } });
    const [estimate] = await straightLineEstimator.estimate({ lat: 42.2835, lng: -71.3495 }, [killington]);
    expect(estimate.resortId).toBe('killington');
    expect(estimate.method).toBe('straight-line');
    expect(estimate.minutes).toBeUndefined();
    expect(estimate.miles).toBeCloseTo(118.16, 1);
  });
});
