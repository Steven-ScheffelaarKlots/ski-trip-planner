import { describe, expect, it } from 'vitest';
import { EMPTY_TRAVEL } from '@/lib/filters/types';
import { sortResorts } from '@/lib/sort';
import { makeResort } from '@/lib/test-fixtures';
import type { TravelEstimate } from '@/lib/types';

const a = makeResort({ id: 'a', name: 'Alpha', stats: { verticalFt: 1000, trailCount: 50 } });
const b = makeResort({ id: 'b', name: 'Bravo', stats: { verticalFt: 3000 } });
const c = makeResort({ id: 'c', name: 'Charlie', stats: { trailCount: 100 } });
const resorts = [c, b, a];

const travel = new Map<string, TravelEstimate>([
  ['a', { resortId: 'a', miles: 90, method: 'straight-line' }],
  ['b', { resortId: 'b', miles: 30, method: 'straight-line' }],
  ['c', { resortId: 'c', miles: 60, method: 'straight-line' }],
]);

const ids = (list: { id: string }[]) => list.map((r) => r.id);

describe('sortResorts', () => {
  it('sorts by name', () => {
    expect(ids(sortResorts(resorts, 'name', EMPTY_TRAVEL))).toEqual(['a', 'b', 'c']);
  });

  it('sorts by vertical descending, missing last', () => {
    expect(ids(sortResorts(resorts, 'vertical', EMPTY_TRAVEL))).toEqual(['b', 'a', 'c']);
  });

  it('sorts by trails descending, missing last', () => {
    expect(ids(sortResorts(resorts, 'trails', EMPTY_TRAVEL))).toEqual(['c', 'a', 'b']);
  });

  it('sorts by distance ascending', () => {
    expect(ids(sortResorts(resorts, 'distance', travel))).toEqual(['b', 'c', 'a']);
  });

  it('falls back to name when sorting by distance without a location', () => {
    expect(ids(sortResorts(resorts, 'distance', EMPTY_TRAVEL))).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input', () => {
    const input = [c, b, a];
    sortResorts(input, 'name', EMPTY_TRAVEL);
    expect(ids(input)).toEqual(['c', 'b', 'a']);
  });
});
