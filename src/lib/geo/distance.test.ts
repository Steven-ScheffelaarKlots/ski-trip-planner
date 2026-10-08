import { describe, expect, it } from 'vitest';
import { haversineMiles } from '@/lib/geo/distance';

describe('haversineMiles', () => {
  it('computes Boston → New York City', () => {
    expect(haversineMiles({ lat: 42.3601, lng: -71.0589 }, { lat: 40.7128, lng: -74.006 })).toBeCloseTo(190.21, 1);
  });

  it('is zero for the same point', () => {
    expect(haversineMiles({ lat: 44, lng: -72 }, { lat: 44, lng: -72 })).toBe(0);
  });
});
