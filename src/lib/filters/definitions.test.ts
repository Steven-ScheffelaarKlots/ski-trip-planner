import { describe, expect, it } from 'vitest';
import { applyFilters } from '@/lib/filters/apply';
import { buildFilters } from '@/lib/filters/definitions';
import { EMPTY_TRAVEL, type FilterContext, type MultiFilterDef, type RangeFilterDef } from '@/lib/filters/types';
import { makeResort } from '@/lib/test-fixtures';
import type { Pass } from '@/lib/types';

const passes: Pass[] = [
  { id: 'epic', name: 'Epic Pass', website: 'https://www.epicpass.com' },
  { id: 'ikon', name: 'Ikon Pass', website: 'https://www.ikonpass.com' },
];

const vt = makeResort({
  id: 'vt',
  location: { state: 'VT', lat: 44, lng: -72.8 },
  stats: { verticalFt: 3050, trailCount: 155, skiableAcres: 1509 },
  terrain: { basis: 'trails', beginner: 17, intermediate: 40, advanced: 43 },
  features: { nightSkiing: false },
});
const ma = makeResort({
  id: 'ma',
  location: { state: 'MA', lat: 42.5, lng: -71.9 },
  stats: { verticalFt: 1000, trailCount: 27, skiableAcres: 110 },
  terrain: { basis: 'trails', beginner: 30, intermediate: 60, advanced: 10 },
  features: { nightSkiing: true },
});

const defs = buildFilters([vt, ma], passes);
const byId = <T>(id: string) => defs.find((d) => d.id === id) as T;
const ctx: FilterContext = { travel: EMPTY_TRAVEL, passesByResort: new Map([['vt', ['ikon']]]) };
const ids = (state: Record<string, unknown>) => applyFilters([vt, ma], defs, state as never, ctx).map((r) => r.id);

describe('buildFilters', () => {
  it('declares the MVP filters in display order', () => {
    expect(defs.map((d) => d.id)).toEqual([
      'state',
      'pass',
      'size',
      'distance',
      'vertical',
      'trails',
      'acres',
      'nightSkiing',
      'beginnerTerrain',
      'expertTerrain',
    ]);
  });

  it('only offers states that have resorts', () => {
    expect(byId<MultiFilterDef>('state').options.map((o) => o.value)).toEqual(['VT', 'MA']);
  });

  it('offers every registered pass', () => {
    expect(byId<MultiFilterDef>('pass').options).toEqual([
      { value: 'epic', label: 'Epic Pass' },
      { value: 'ikon', label: 'Ikon Pass' },
    ]);
  });

  it('derives range maxima from data, rounded up to the step', () => {
    expect(byId<RangeFilterDef>('vertical').max).toBe(3100);
    expect(byId<RangeFilterDef>('trails').max).toBe(155);
    expect(byId<RangeFilterDef>('acres').max).toBe(1550);
    expect(byId<RangeFilterDef>('distance')).toMatchObject({ max: 300, mode: 'max', requiresLocation: true });
  });

  it('filters by state, pass, size, and toggles', () => {
    expect(ids({ state: ['MA'] })).toEqual(['ma']);
    expect(ids({ pass: ['ikon'] })).toEqual(['vt']);
    expect(ids({ size: ['large'] })).toEqual(['vt']);
    expect(ids({ nightSkiing: true })).toEqual(['ma']);
    expect(ids({ beginnerTerrain: true })).toEqual(['ma']);
    expect(ids({ expertTerrain: true })).toEqual(['vt']);
  });
});
