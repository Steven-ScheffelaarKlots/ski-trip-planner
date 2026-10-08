import type { LatLng } from '@/lib/types';

export type UserLocation = { label: string; coords: LatLng };

export const LOCATION_STORAGE_KEY = 'ski-trip-planner:location';

export function parseStoredLocation(raw: string | null): UserLocation | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const { label, coords } = value as { label?: unknown; coords?: { lat?: unknown; lng?: unknown } };
    if (typeof label !== 'string' || typeof coords?.lat !== 'number' || typeof coords?.lng !== 'number') return null;
    return { label, coords: { lat: coords.lat, lng: coords.lng } };
  } catch {
    return null;
  }
}
