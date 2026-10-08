import { BEGINNER_TERRAIN_MIN_PCT, EXPERT_TERRAIN_MIN_PCT } from '@/lib/config';
import type { FilterDefinition, RangeFilterDef } from '@/lib/filters/types';
import { SIZE_LABELS, STATE_NAMES, sizeClass, type SizeClass } from '@/lib/resort';
import type { Pass, SkiResort, StateCode } from '@/lib/types';

const STATE_ORDER: StateCode[] = ['VT', 'NH', 'ME', 'MA', 'CT', 'RI'];
const SIZE_ORDER: SizeClass[] = ['small', 'medium', 'large'];

const MAX_DRIVE_HOURS = 6;

function dataMax(resorts: SkiResort[], get: (r: SkiResort) => number | undefined, step: number): number {
  const values = resorts.map(get).filter((v): v is number => v !== undefined);
  const max = values.length ? Math.max(...values) : step;
  return Math.ceil(max / step) * step;
}

function statRange(
  resorts: SkiResort[],
  id: string,
  label: string,
  unit: string,
  step: number,
  get: (r: SkiResort) => number | undefined,
): RangeFilterDef {
  return { id, label, control: 'range', unit, min: 0, max: dataMax(resorts, get, step), step, mode: 'between', getValue: get };
}

/**
 * The filter registry. To add a filter, add one entry here; the panel and
 * applyFilters() pick it up automatically.
 */
export function buildFilters(resorts: SkiResort[], passes: Pass[]): FilterDefinition[] {
  const presentStates = new Set(resorts.map((r) => r.location.state));

  return [
    {
      id: 'state',
      label: 'State',
      control: 'multi',
      options: STATE_ORDER.filter((s) => presentStates.has(s)).map((s) => ({ value: s, label: STATE_NAMES[s] })),
      getValues: (r) => [r.location.state],
    },
    {
      id: 'pass',
      label: 'Pass',
      control: 'multi',
      options: passes.map((p) => ({ value: p.id, label: p.name })),
      getValues: (r, ctx) => ctx.passesByResort.get(r.id) ?? [],
    },
    {
      id: 'size',
      label: 'Mountain size',
      description: 'By vertical drop',
      control: 'multi',
      options: SIZE_ORDER.map((s) => ({ value: s, label: SIZE_LABELS[s] })),
      getValues: (r) => {
        const size = sizeClass(r);
        return size ? [size] : [];
      },
    },
    {
      id: 'driveTime',
      label: 'Max drive time',
      description: 'Estimated driving time from your location',
      control: 'range',
      unit: 'h',
      min: 0,
      max: MAX_DRIVE_HOURS,
      step: 0.5,
      mode: 'max',
      requiresLocation: true,
      getValue: (r, ctx) => {
        const minutes = ctx.travel.get(r.id)?.minutes;
        return minutes === undefined ? undefined : minutes / 60;
      },
    },
    statRange(resorts, 'vertical', 'Vertical drop', 'ft', 100, (r) => r.stats.verticalFt),
    statRange(resorts, 'trails', 'Trail count', 'trails', 5, (r) => r.stats.trailCount),
    statRange(resorts, 'acres', 'Skiable acres', 'acres', 50, (r) => r.stats.skiableAcres),
    {
      id: 'nightSkiing',
      label: 'Night skiing',
      control: 'toggle',
      test: (r) => r.features.nightSkiing === true,
    },
    {
      id: 'beginnerTerrain',
      label: 'Beginner terrain',
      description: `At least ${BEGINNER_TERRAIN_MIN_PCT}% beginner (green) terrain`,
      control: 'toggle',
      test: (r) => (r.terrain?.beginner ?? 0) >= BEGINNER_TERRAIN_MIN_PCT,
    },
    {
      id: 'expertTerrain',
      label: 'Advanced/expert terrain',
      description: `At least ${EXPERT_TERRAIN_MIN_PCT}% black or double-black terrain`,
      control: 'toggle',
      test: (r) => (r.terrain?.advanced ?? 0) + (r.terrain?.expert ?? 0) >= EXPERT_TERRAIN_MIN_PCT,
    },
  ];
}
