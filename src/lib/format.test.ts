import { describe, expect, it } from 'vitest';
import {
  describeTravel,
  formatCoords,
  formatDuration,
  formatMiles,
  formatNumber,
  passAccessLabel,
  travelNote,
  withUnit,
  yesNo,
} from '@/lib/format';
import type { TravelEstimate } from '@/lib/types';

const src = { label: 's', url: 'https://example.com', retrievedAt: '2026-10-08' };

describe('format', () => {
  it('formats numbers with separators and a dash for missing', () => {
    expect(formatNumber(3050)).toBe('3,050');
    expect(formatNumber(undefined)).toBe('—');
    expect(withUnit(1509, 'acres')).toBe('1,509 acres');
    expect(withUnit(undefined, 'ft')).toBe('—');
    expect(withUnit(155, '')).toBe('155');
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

describe('drive time formatting', () => {
  it('formats minutes as hours and minutes', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(165)).toBe('2 h 45 min');
  });

  it('describes routed, estimated, and straight-line travel', () => {
    expect(describeTravel({ resortId: 'a', miles: 152.4, minutes: 165, method: 'routing' })).toEqual({
      primary: '2 h 45 min',
      detail: '152 mi by road',
    });
    expect(describeTravel({ resortId: 'a', miles: 118.2, minutes: 161, method: 'estimated' })).toEqual({
      primary: '~2 h 41 min',
      detail: 'rough estimate · 118 mi straight-line',
    });
    expect(describeTravel({ resortId: 'a', miles: 118.2, method: 'straight-line' })).toEqual({
      primary: '118 mi',
      detail: 'straight-line',
    });
  });

  it('summarizes where drive times come from', () => {
    const routed: TravelEstimate = { resortId: 'a', miles: 1, minutes: 1, method: 'routing' };
    const rough: TravelEstimate = { resortId: 'b', miles: 1, minutes: 1, method: 'estimated' };
    expect(travelNote(new Map())).toBeUndefined();
    expect(travelNote(new Map([['b', rough]]))).toBe('Drive times are rough estimates based on straight-line distance.');
    expect(travelNote(new Map([['a', routed], ['b', rough]]))).toBe(
      'Drive times by road from OpenRouteService; traffic not included.',
    );
  });
});
