import { describe, expect, it } from 'vitest';
import { normalizeZip, resolveZip, type ZipTable } from '@/lib/geo/geocode';

const table: ZipTable = { '01760': [42.2848, -71.3488], '05401': [44.4752, -73.2179] };

describe('normalizeZip', () => {
  it('accepts 5-digit and ZIP+4, trimming whitespace', () => {
    expect(normalizeZip(' 01760 ')).toBe('01760');
    expect(normalizeZip('01760-1234')).toBe('01760');
  });

  it('rejects malformed input', () => {
    expect(normalizeZip('1760')).toBeNull();
    expect(normalizeZip('abcde')).toBeNull();
    expect(normalizeZip('')).toBeNull();
  });
});

describe('resolveZip', () => {
  it('returns coordinates for a known New England ZIP', () => {
    expect(resolveZip('01760-1234', table)).toEqual({ ok: true, zip: '01760', coords: { lat: 42.2848, lng: -71.3488 } });
  });

  it('explains malformed input', () => {
    expect(resolveZip('1760', table)).toEqual({ ok: false, error: 'Enter a 5-digit ZIP code.' });
  });

  it('explains a New England ZIP that has no location (e.g. PO-box only)', () => {
    expect(resolveZip('05402', table)).toEqual({
      ok: false,
      error: "We don't have a location for ZIP 05402 (it may be a PO box). Try a nearby ZIP or use your location.",
    });
  });

  it('explains a ZIP outside New England', () => {
    expect(resolveZip('10001', table)).toEqual({
      ok: false,
      error: "That ZIP isn't in New England. Enter a New England ZIP or use your location.",
    });
  });
});
