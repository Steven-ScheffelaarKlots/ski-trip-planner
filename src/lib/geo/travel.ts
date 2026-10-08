import { haversineMiles } from '@/lib/geo/distance';
import type { LatLng, SkiResort, TravelEstimate } from '@/lib/types';

/** Swap implementations (e.g. a routing API behind a route handler) without touching the UI. */
export interface TravelEstimator {
  estimate(origin: LatLng, resorts: SkiResort[]): Promise<TravelEstimate[]>;
}

export const straightLineEstimator: TravelEstimator = {
  async estimate(origin, resorts) {
    return resorts.map((r) => ({
      resortId: r.id,
      miles: haversineMiles(origin, r.location),
      method: 'straight-line' as const,
    }));
  },
};
