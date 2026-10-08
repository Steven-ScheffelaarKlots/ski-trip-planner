import { useEffect, useState } from 'react';
import { EMPTY_TRAVEL } from '@/lib/filters/types';
import { straightLineEstimator, type TravelEstimator } from '@/lib/geo/travel';
import type { UserLocation } from '@/lib/geo/stored-location';
import type { SkiResort, TravelEstimate } from '@/lib/types';

type Result = { origin: UserLocation; estimates: ReadonlyMap<string, TravelEstimate> };

/** Async so a routing-API estimator can replace the straight-line one without UI changes. */
export function useTravelEstimates(
  location: UserLocation | null,
  resorts: SkiResort[],
  estimator: TravelEstimator = straightLineEstimator,
): ReadonlyMap<string, TravelEstimate> {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    estimator.estimate(location.coords, resorts).then((list) => {
      if (!cancelled) setResult({ origin: location, estimates: new Map(list.map((e) => [e.resortId, e])) });
    });
    return () => {
      cancelled = true;
    };
  }, [location, resorts, estimator]);

  // Derived rather than reset in the effect: stale results never show for a different/cleared location.
  return location && result?.origin === location ? result.estimates : EMPTY_TRAVEL;
}
