import { describe, expect, it } from 'vitest';
import { parseStoredLocation } from '@/lib/geo/stored-location';

describe('parseStoredLocation', () => {
  it('parses a valid stored location', () => {
    const raw = JSON.stringify({ label: 'ZIP 01760', coords: { lat: 42.28, lng: -71.35 } });
    expect(parseStoredLocation(raw)).toEqual({ label: 'ZIP 01760', coords: { lat: 42.28, lng: -71.35 } });
  });

  it('returns null for missing, corrupt, or wrong-shaped values', () => {
    expect(parseStoredLocation(null)).toBeNull();
    expect(parseStoredLocation('{not json')).toBeNull();
    expect(parseStoredLocation(JSON.stringify({ label: 'x', coords: { lat: 'a', lng: 1 } }))).toBeNull();
    expect(parseStoredLocation(JSON.stringify({ coords: { lat: 1, lng: 1 } }))).toBeNull();
  });
});
