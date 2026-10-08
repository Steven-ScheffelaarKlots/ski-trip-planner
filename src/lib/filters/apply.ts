import type { FilterContext, FilterDefinition, FilterState, FilterValue } from '@/lib/filters/types';
import type { SkiResort } from '@/lib/types';

const isRange = (v: FilterValue | undefined): v is [number, number] =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === 'number';

export function isFilterActive(def: FilterDefinition, value: FilterValue | undefined): boolean {
  switch (def.control) {
    case 'range':
      return isRange(value) && (value[0] > def.min || value[1] < def.max);
    case 'multi':
      return Array.isArray(value) && value.length > 0;
    case 'toggle':
      return value === true;
  }
}

export function matchesFilter(
  resort: SkiResort,
  def: FilterDefinition,
  value: FilterValue | undefined,
  ctx: FilterContext,
): boolean {
  if (!isFilterActive(def, value)) return true;

  switch (def.control) {
    case 'range': {
      if (def.requiresLocation && ctx.travel.size === 0) return true;
      const [lo, hi] = value as [number, number];
      const x = def.getValue(resort, ctx);
      if (x === undefined) return false;
      // A bound sitting at the slider's extent is open-ended.
      if (lo > def.min && x < lo) return false;
      if (hi < def.max && x > hi) return false;
      return true;
    }
    case 'multi': {
      const selected = value as string[];
      return def.getValues(resort, ctx).some((v) => selected.includes(v));
    }
    case 'toggle':
      return def.test(resort, ctx);
  }
}

export function applyFilters(
  resorts: SkiResort[],
  defs: FilterDefinition[],
  state: FilterState,
  ctx: FilterContext,
): SkiResort[] {
  return resorts.filter((r) => defs.every((def) => matchesFilter(r, def, state[def.id], ctx)));
}

export function activeFilterCount(defs: FilterDefinition[], state: FilterState): number {
  return defs.filter((def) => isFilterActive(def, state[def.id])).length;
}
