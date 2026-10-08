import { roughDriveEstimator } from '@/lib/geo/drive-estimate';
import { roundOrigin } from '@/lib/geo/ors';
import type { TravelEstimator } from '@/lib/geo/travel';
import type { TravelEstimate } from '@/lib/types';

/** Routed results win; anything the router couldn't answer keeps its rough estimate. */
export function mergeEstimates(routed: TravelEstimate[], fallback: TravelEstimate[]): TravelEstimate[] {
  const byId = new Map(routed.map((e) => [e.resortId, e]));
  return fallback.map((e) => byId.get(e.resortId) ?? e);
}

/**
 * Asks the app's /api/travel route (which holds the routing API key) for road drive times,
 * falling back to rough estimates whenever routing is unavailable.
 */
export function createDriveTimeEstimator(fetchImpl: typeof fetch = (...args) => fetch(...args)): TravelEstimator {
  let routingConfigured = true;

  return {
    async estimate(origin, resorts) {
      const fallback = await roughDriveEstimator.estimate(origin, resorts);
      if (!routingConfigured) return fallback;
      try {
        const res = await fetchImpl('/api/travel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roundOrigin(origin)),
        });
        const data: unknown = await res.json().catch(() => null);
        if (res.status === 503 && (data as { error?: unknown } | null)?.error === 'not-configured') {
          routingConfigured = false;
        }
        if (!res.ok) return fallback;
        const routed = (data as { estimates?: unknown } | null)?.estimates;
        return Array.isArray(routed) ? mergeEstimates(routed as TravelEstimate[], fallback) : fallback;
      } catch {
        return fallback;
      }
    },
  };
}

export const driveTimeEstimator = createDriveTimeEstimator();
