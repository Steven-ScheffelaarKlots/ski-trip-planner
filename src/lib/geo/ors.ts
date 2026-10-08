import type { LatLng, SkiResort, TravelEstimate } from '@/lib/types';

/** Server-side only: talks to OpenRouteService with the secret API key. */
export const ORS_MATRIX_URL = 'https://api.openrouteservice.org/v2/matrix/driving-car';

/** ORS limits a matrix request to 50 locations: the origin plus 49 destinations. */
const MAX_DESTINATIONS_PER_REQUEST = 49;
const REQUEST_TIMEOUT_MS = 10_000;

export function parseOrigin(body: unknown): LatLng | null {
  if (typeof body !== 'object' || body === null) return null;
  const { lat, lng } = body as { lat?: unknown; lng?: unknown };
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/** ~1 km precision: enough for drive times, and it keeps exact locations out of logs and caches. */
export function roundOrigin({ lat, lng }: LatLng): LatLng {
  return { lat: Math.round(lat * 100) / 100, lng: Math.round(lng * 100) / 100 };
}

export function buildMatrixRequest(origin: LatLng, resorts: SkiResort[]) {
  return {
    locations: [[origin.lng, origin.lat], ...resorts.map((r) => [r.location.lng, r.location.lat])],
    sources: [0],
    destinations: resorts.map((_, i) => i + 1),
    metrics: ['duration', 'distance'],
    units: 'mi',
  };
}

/** Durations are seconds and distances are miles; unroutable destinations come back as null and are skipped. */
export function parseMatrixResponse(body: unknown, resorts: SkiResort[]): TravelEstimate[] {
  const { durations, distances } = (body ?? {}) as { durations?: unknown; distances?: unknown };
  const row = (m: unknown) => (Array.isArray(m) && Array.isArray(m[0]) ? (m[0] as unknown[]) : []);
  const seconds = row(durations);
  const miles = row(distances);

  return resorts.flatMap((r, i) => {
    const s = seconds[i];
    const d = miles[i];
    if (typeof s !== 'number' || typeof d !== 'number') return [];
    return [{ resortId: r.id, minutes: Math.round(s / 60), miles: d, method: 'routing' as const }];
  });
}

export async function fetchDriveTimes(origin: LatLng, resorts: SkiResort[], apiKey: string): Promise<TravelEstimate[]> {
  const batches: SkiResort[][] = [];
  for (let i = 0; i < resorts.length; i += MAX_DESTINATIONS_PER_REQUEST) {
    batches.push(resorts.slice(i, i + MAX_DESTINATIONS_PER_REQUEST));
  }

  const results = await Promise.all(
    batches.map(async (batch) => {
      const res = await fetch(ORS_MATRIX_URL, {
        method: 'POST',
        headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildMatrixRequest(origin, batch)),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`OpenRouteService matrix request failed: ${res.status} ${await res.text()}`);
      return parseMatrixResponse(await res.json(), batch);
    }),
  );
  return results.flat();
}
