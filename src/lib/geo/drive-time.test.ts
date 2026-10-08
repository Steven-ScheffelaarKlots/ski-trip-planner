import { describe, expect, it, vi } from 'vitest';
import { createDriveTimeEstimator, mergeEstimates } from '@/lib/geo/drive-time';
import { makeResort } from '@/lib/test-fixtures';
import type { TravelEstimate } from '@/lib/types';

const a = makeResort({ id: 'a', location: { state: 'VT', lat: 44, lng: -72 } });
const b = makeResort({ id: 'b', location: { state: 'ME', lat: 45, lng: -70 } });
const origin = { lat: 42.28482, lng: -71.34881 };

describe('mergeEstimates', () => {
  it('prefers routed estimates and fills gaps from the fallback, keeping fallback order', () => {
    const routed: TravelEstimate[] = [{ resortId: 'b', miles: 230, minutes: 241, method: 'routing' }];
    const fallback: TravelEstimate[] = [
      { resortId: 'a', miles: 100, minutes: 136, method: 'estimated' },
      { resortId: 'b', miles: 190, minutes: 259, method: 'estimated' },
    ];
    expect(mergeEstimates(routed, fallback)).toEqual([fallback[0], routed[0]]);
  });
});

describe('createDriveTimeEstimator', () => {
  it('uses routed results from /api/travel and sends a rounded origin', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ estimates: [{ resortId: 'a', miles: 150, minutes: 170, method: 'routing' }] }),
    );
    const result = await createDriveTimeEstimator(fetchMock).estimate(origin, [a, b]);
    expect(result.find((e) => e.resortId === 'a')?.method).toBe('routing');
    expect(result.find((e) => e.resortId === 'b')?.method).toBe('estimated');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/travel');
    expect(JSON.parse(init.body as string)).toEqual({ lat: 42.28, lng: -71.35 });
  });

  it('falls back to rough estimates when the route fails or is unreachable', async () => {
    const failing = vi.fn(async () => new Response('', { status: 502 }));
    expect((await createDriveTimeEstimator(failing).estimate(origin, [a])).map((e) => e.method)).toEqual(['estimated']);
    const throwing = vi.fn(async () => {
      throw new TypeError('network');
    });
    expect((await createDriveTimeEstimator(throwing).estimate(origin, [a])).map((e) => e.method)).toEqual(['estimated']);
  });

  it('stops calling the route after it reports routing is not configured', async () => {
    const fetchMock = vi.fn(async () => Response.json({ error: 'not-configured' }, { status: 503 }));
    const estimator = createDriveTimeEstimator(fetchMock);
    await estimator.estimate(origin, [a]);
    await estimator.estimate(origin, [a]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
