import { describe, expect, it } from 'vitest';
import { activeFilterCount, applyFilters, isFilterActive, matchesFilter } from '@/lib/filters/apply';
import { EMPTY_TRAVEL, type FilterContext, type FilterDefinition, type RangeFilterDef } from '@/lib/filters/types';
import { makeResort } from '@/lib/test-fixtures';

const ctx: FilterContext = { travel: EMPTY_TRAVEL, passesByResort: new Map() };

const acres: RangeFilterDef = {
  id: 'acres',
  label: 'Skiable acres',
  control: 'range',
  unit: 'acres',
  min: 0,
  max: 1600,
  step: 50,
  mode: 'between',
  getValue: (r) => r.stats.skiableAcres,
};

const distance: RangeFilterDef = {
  id: 'distance',
  label: 'Max distance',
  control: 'range',
  unit: 'mi',
  min: 0,
  max: 300,
  step: 10,
  mode: 'max',
  requiresLocation: true,
  getValue: (r, c) => c.travel.get(r.id)?.miles,
};

const state: FilterDefinition = {
  id: 'state',
  label: 'State',
  control: 'multi',
  options: [
    { value: 'VT', label: 'Vermont' },
    { value: 'ME', label: 'Maine' },
  ],
  getValues: (r) => [r.location.state],
};

const night: FilterDefinition = {
  id: 'night',
  label: 'Night skiing',
  control: 'toggle',
  test: (r) => r.features.nightSkiing === true,
};

const big = makeResort({ id: 'big', stats: { skiableAcres: 1500 }, features: { nightSkiing: false } });
const small = makeResort({ id: 'small', stats: { skiableAcres: 100 }, features: { nightSkiing: true } });
const unknown = makeResort({ id: 'unknown', stats: {}, location: { state: 'ME', lat: 44.5, lng: -70.5 } });

describe('isFilterActive', () => {
  it('range is active only when narrowed from full extent', () => {
    expect(isFilterActive(acres, undefined)).toBe(false);
    expect(isFilterActive(acres, [0, 1600])).toBe(false);
    expect(isFilterActive(acres, [100, 1600])).toBe(true);
    expect(isFilterActive(acres, [0, 1000])).toBe(true);
  });

  it('multi is active with a selection; toggle when true', () => {
    expect(isFilterActive(state, [])).toBe(false);
    expect(isFilterActive(state, ['VT'])).toBe(true);
    expect(isFilterActive(night, false)).toBe(false);
    expect(isFilterActive(night, true)).toBe(true);
  });
});

describe('matchesFilter', () => {
  it('range filter at full extent keeps resorts missing the stat', () => {
    expect(matchesFilter(unknown, acres, [0, 1600], ctx)).toBe(true);
    expect(matchesFilter(unknown, acres, undefined, ctx)).toBe(true);
  });

  it('narrowed range excludes resorts missing the stat', () => {
    expect(matchesFilter(unknown, acres, [200, 1600], ctx)).toBe(false);
  });

  it('range bound at the slider max means "and above"', () => {
    const huge = makeResort({ stats: { skiableAcres: 5000 } });
    expect(matchesFilter(huge, acres, [1000, 1600], ctx)).toBe(true);
    expect(matchesFilter(huge, acres, [1000, 1500], ctx)).toBe(false);
  });

  it('range checks both bounds inclusively', () => {
    expect(matchesFilter(big, acres, [100, 1500], ctx)).toBe(true);
    expect(matchesFilter(small, acres, [150, 1600], ctx)).toBe(false);
  });

  it('distance filter is ignored when there is no location', () => {
    expect(matchesFilter(big, distance, [0, 50], ctx)).toBe(true);
  });

  it('distance filter applies when travel data exists', () => {
    const withTravel: FilterContext = {
      ...ctx,
      travel: new Map([
        ['big', { resortId: 'big', miles: 40, method: 'straight-line' }],
        ['small', { resortId: 'small', miles: 120, method: 'straight-line' }],
      ]),
    };
    expect(matchesFilter(big, distance, [0, 50], withTravel)).toBe(true);
    expect(matchesFilter(small, distance, [0, 50], withTravel)).toBe(false);
  });

  it('multi matches any selected value', () => {
    expect(matchesFilter(big, state, ['VT', 'ME'], ctx)).toBe(true);
    expect(matchesFilter(unknown, state, ['VT'], ctx)).toBe(false);
  });

  it('toggle filters by predicate only when on', () => {
    expect(matchesFilter(big, night, true, ctx)).toBe(false);
    expect(matchesFilter(big, night, false, ctx)).toBe(true);
  });
});

describe('applyFilters', () => {
  it('ANDs all active filters', () => {
    const result = applyFilters([big, small, unknown], [acres, night, state], { acres: [50, 1600], night: true }, ctx);
    expect(result.map((r) => r.id)).toEqual(['small']);
  });

  it('returns everything with no active filters', () => {
    expect(applyFilters([big, small, unknown], [acres, night, state], {}, ctx)).toHaveLength(3);
  });
});

describe('activeFilterCount', () => {
  it('counts only active filters', () => {
    expect(activeFilterCount([acres, night, state], { acres: [0, 1600], night: true, state: ['VT'] })).toBe(2);
  });
});
