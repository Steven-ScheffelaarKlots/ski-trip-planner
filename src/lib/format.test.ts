import { describe, expect, it } from 'vitest';
import { formatCoords, formatMiles, formatNumber, passAccessLabel, withUnit, yesNo } from '@/lib/format';

const src = { label: 's', url: 'https://example.com', retrievedAt: '2026-10-08' };

describe('format', () => {
  it('formats numbers with separators and a dash for missing', () => {
    expect(formatNumber(3050)).toBe('3,050');
    expect(formatNumber(undefined)).toBe('—');
    expect(withUnit(1509, 'acres')).toBe('1,509 acres');
    expect(withUnit(undefined, 'ft')).toBe('—');
  });

  it('rounds miles', () => {
    expect(formatMiles(118.16)).toBe('118 mi');
  });

  it('formats coordinates to 4 decimals', () => {
    expect(formatCoords({ lat: 43.62621, lng: -72.79669 })).toBe('43.6262, -72.7967');
  });

  it('labels pass access', () => {
    expect(passAccessLabel({ resortId: 'a', passId: 'ikon', season: '2026-27', access: 'unlimited', source: src })).toBe('Unlimited');
    expect(passAccessLabel({ resortId: 'a', passId: 'ikon', season: '2026-27', access: 'limited', source: src })).toBe('Limited access');
    expect(passAccessLabel({ resortId: 'a', passId: 'indy', season: '2026-27', access: 'days', days: 2, source: src })).toBe('2 days');
    expect(passAccessLabel({ resortId: 'a', passId: 'indy', season: '2026-27', access: 'days', days: 1, source: src })).toBe('1 day');
  });

  it('formats optional booleans', () => {
    expect(yesNo(true)).toBe('Yes');
    expect(yesNo(false)).toBe('No');
    expect(yesNo(undefined)).toBe('Unknown');
  });
});
