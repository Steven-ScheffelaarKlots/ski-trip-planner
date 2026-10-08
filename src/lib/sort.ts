import type { SkiResort, TravelEstimate } from '@/lib/types';

export type SortKey = 'distance' | 'vertical' | 'trails' | 'name';

export const SORT_LABELS: Record<SortKey, string> = {
  distance: 'Drive time',
  vertical: 'Vertical drop',
  trails: 'Trail count',
  name: 'Name',
};

const byName = (a: SkiResort, b: SkiResort) => a.name.localeCompare(b.name);

/** Missing values sort last; ties broken by name. */
function byNumber(get: (r: SkiResort) => number | undefined, direction: 1 | -1) {
  return (a: SkiResort, b: SkiResort) => {
    const x = get(a);
    const y = get(b);
    if (x === undefined && y === undefined) return byName(a, b);
    if (x === undefined) return 1;
    if (y === undefined) return -1;
    return (x - y) * direction || byName(a, b);
  };
}

export function sortResorts(
  resorts: SkiResort[],
  key: SortKey,
  travel: ReadonlyMap<string, TravelEstimate>,
): SkiResort[] {
  const list = [...resorts];
  switch (key) {
    case 'distance':
      return travel.size === 0 ? list.sort(byName) : list.sort(byNumber((r) => travel.get(r.id)?.minutes ?? travel.get(r.id)?.miles, 1));
    case 'vertical':
      return list.sort(byNumber((r) => r.stats.verticalFt, -1));
    case 'trails':
      return list.sort(byNumber((r) => r.stats.trailCount, -1));
    case 'name':
      return list.sort(byName);
  }
}
