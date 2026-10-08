import type { LatLng, PassAffiliation, TravelEstimate } from '@/lib/types';

export function formatNumber(n?: number): string {
  return n === undefined ? '—' : n.toLocaleString('en-US');
}

export function withUnit(n: number | undefined, unit: string): string {
  return n === undefined ? '—' : `${formatNumber(n)} ${unit}`.trim();
}

export function formatMiles(miles: number): string {
  return `${Math.round(miles).toLocaleString('en-US')} mi`;
}

export function formatCoords({ lat, lng }: LatLng): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function passAccessLabel(a: PassAffiliation): string {
  switch (a.access) {
    case 'unlimited':
      return 'Unlimited';
    case 'limited':
      return 'Limited access';
    case 'days':
      return `${a.days} ${a.days === 1 ? 'day' : 'days'}`;
  }
}

export function yesNo(v?: boolean): string {
  return v === undefined ? 'Unknown' : v ? 'Yes' : 'No';
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Headline (drive time when known) plus a qualifier saying how it was measured. */
export function describeTravel(e: TravelEstimate): { primary: string; detail: string } {
  if (e.minutes !== undefined && e.method === 'routing') {
    return { primary: formatDuration(e.minutes), detail: `${formatMiles(e.miles)} by road` };
  }
  if (e.minutes !== undefined) {
    return { primary: `~${formatDuration(e.minutes)}`, detail: `rough estimate · ${formatMiles(e.miles)} straight-line` };
  }
  return { primary: formatMiles(e.miles), detail: 'straight-line' };
}

export function travelNote(travel: ReadonlyMap<string, TravelEstimate>): string | undefined {
  if (travel.size === 0) return undefined;
  const routed = [...travel.values()].some((e) => e.method === 'routing');
  return routed
    ? 'Drive times by road from OpenRouteService; traffic not included.'
    : 'Drive times are rough estimates based on straight-line distance.';
}
