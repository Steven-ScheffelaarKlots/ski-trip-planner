import type { PassId, SkiResort, TravelEstimate } from '@/lib/types';

/** Derived data that predicates may need. */
export type FilterContext = {
  /** Empty when the user has not set a location. */
  travel: ReadonlyMap<string, TravelEstimate>;
  /** Current-season pass ids per resort. */
  passesByResort: ReadonlyMap<string, PassId[]>;
};

export const EMPTY_TRAVEL: ReadonlyMap<string, TravelEstimate> = new Map();

type BaseDef = { id: string; label: string; description?: string };

export type RangeFilterDef = BaseDef & {
  control: 'range';
  unit: string;
  min: number;
  max: number;
  step: number;
  /** 'max' renders a single "up to" thumb (e.g. max distance). */
  mode: 'between' | 'max';
  /** Ignored entirely when the context has no travel data. */
  requiresLocation?: boolean;
  getValue(resort: SkiResort, ctx: FilterContext): number | undefined;
};

export type MultiFilterDef = BaseDef & {
  control: 'multi';
  options: { value: string; label: string }[];
  /** A resort matches if any of its values is selected. */
  getValues(resort: SkiResort, ctx: FilterContext): string[];
};

export type ToggleFilterDef = BaseDef & {
  control: 'toggle';
  test(resort: SkiResort, ctx: FilterContext): boolean;
};

export type FilterDefinition = RangeFilterDef | MultiFilterDef | ToggleFilterDef;

/** range → [lo, hi]; multi → selected values; toggle → on/off. */
export type FilterValue = [number, number] | string[] | boolean;

export type FilterState = Record<string, FilterValue | undefined>;
