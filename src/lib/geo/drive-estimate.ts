import { haversineMiles } from '@/lib/geo/distance';
import type { TravelEstimator } from '@/lib/geo/travel';

/** Roads wind; typical New England trips run ~25% longer than the straight line. */
const ROAD_FACTOR = 1.25;
const AVERAGE_SPEED_MPH = 55;

export function estimateDriveMinutes(straightLineMiles: number): number {
  return Math.round(((straightLineMiles * ROAD_FACTOR) / AVERAGE_SPEED_MPH) * 60);
}

/** Fallback when routing is unavailable: no network, no API key. */
export const roughDriveEstimator: TravelEstimator = {
  async estimate(origin, resorts) {
    return resorts.map((r) => {
      const miles = haversineMiles(origin, r.location);
      return { resortId: r.id, miles, minutes: estimateDriveMinutes(miles), method: 'estimated' as const };
    });
  },
};
