import { RESORTS } from '@/data/resorts';
import { fetchDriveTimes, parseOrigin, roundOrigin } from '@/lib/geo/ors';
import type { TravelEstimate } from '@/lib/types';

/**
 * Drive times from a location to every resort, via OpenRouteService.
 * Runs on the server so ORS_API_KEY never reaches the browser.
 */

const MAX_CACHE_ENTRIES = 500;
// Per server instance. Roads don't move, so entries never expire; the oldest is evicted when full.
const cache = new Map<string, TravelEstimate[]>();

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) return Response.json({ error: 'not-configured' }, { status: 503 });

  const origin = parseOrigin(await request.json().catch(() => null));
  if (!origin) return Response.json({ error: 'invalid-origin' }, { status: 400 });

  const rounded = roundOrigin(origin);
  const key = `${rounded.lat},${rounded.lng}`;
  const cached = cache.get(key);
  if (cached) return Response.json({ estimates: cached });

  try {
    const estimates = await fetchDriveTimes(rounded, RESORTS, apiKey);
    if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!);
    cache.set(key, estimates);
    return Response.json({ estimates });
  } catch (error) {
    console.error('Drive-time lookup failed', error);
    return Response.json({ error: 'routing-failed' }, { status: 502 });
  }
}
