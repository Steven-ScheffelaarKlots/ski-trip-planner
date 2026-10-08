import type { LatLng, PassAffiliation } from '@/lib/types';

export function formatNumber(n?: number): string {
  return n === undefined ? '—' : n.toLocaleString('en-US');
}

export function withUnit(n: number | undefined, unit: string): string {
  return n === undefined ? '—' : `${formatNumber(n)} ${unit}`;
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
