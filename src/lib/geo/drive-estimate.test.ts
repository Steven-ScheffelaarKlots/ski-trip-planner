import { describe, expect, it } from 'vitest';
import { estimateDriveMinutes, roughDriveEstimator } from '@/lib/geo/drive-estimate';
import { makeResort } from '@/lib/test-fixtures';

describe('estimateDriveMinutes', () => {
  it('scales straight-line miles by a road factor at highway speed', () => {
    expect(estimateDriveMinutes(118.2)).toBe(161);
    expect(estimateDriveMinutes(0)).toBe(0);
  });
});

describe('roughDriveEstimator', () => {
  it('returns straight-line miles with estimated minutes', async () => {
    const killington = makeResort({ id: 'killington', location: { state: 'VT', lat: 43.6262, lng: -72.7967 } });
    const [e] = await roughDriveEstimator.estimate({ lat: 42.2835, lng: -71.3495 }, [killington]);
    expect(e).toMatchObject({ resortId: 'killington', method: 'estimated', minutes: 161 });
    expect(e.miles).toBeCloseTo(118.16, 1);
  });
});
