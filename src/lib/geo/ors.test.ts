import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildMatrixRequest,
  fetchDriveTimes,
  parseMatrixResponse,
  parseOrigin,
  roundOrigin,
} from '@/lib/geo/ors';
import { makeResort } from '@/lib/test-fixtures';

const a = makeResort({ id: 'a', location: { state: 'VT', lat: 44, lng: -72 } });
const b = makeResort({ id: 'b', location: { state: 'ME', lat: 45, lng: -70 } });

afterEach(() => vi.unstubAllGlobals());

describe('parseOrigin', () => {
  it('accepts finite lat/lng', () => {
    expect(parseOrigin({ lat: 42.28, lng: -71.35 })).toEqual({ lat: 42.28, lng: -71.35 });
  });

  it('rejects missing, non-numeric, or out-of-range values', () => {
    expect(parseOrigin(null)).toBeNull();
    expect(parseOrigin({ lat: '42', lng: -71 })).toBeNull();
    expect(parseOrigin({ lat: 91, lng: -71 })).toBeNull();
    expect(parseOrigin({ lat: 42, lng: Number.NaN })).toBeNull();
  });
});

describe('roundOrigin', () => {
  it('rounds to 2 decimals (~1 km) for privacy and cache hits', () => {
    expect(roundOrigin({ lat: 42.28482, lng: -71.34881 })).toEqual({ lat: 42.28, lng: -71.35 });
  });
});

describe('buildMatrixRequest', () => {
  it('puts the origin first and asks for duration and distance in miles', () => {
    expect(buildMatrixRequest({ lat: 42, lng: -71 }, [a, b])).toEqual({
      locations: [
        [-71, 42],
        [-72, 44],
        [-70, 45],
      ],
      sources: [0],
      destinations: [1, 2],
      metrics: ['duration', 'distance'],
      units: 'mi',
    });
  });
});

describe('parseMatrixResponse', () => {
  it('maps seconds to minutes and keeps road miles', () => {
    const body = { durations: [[9900, 14460]], distances: [[152.4, 230.1]] };
    expect(parseMatrixResponse(body, [a, b])).toEqual([
      { resortId: 'a', minutes: 165, miles: 152.4, method: 'routing' },
      { resortId: 'b', minutes: 241, miles: 230.1, method: 'routing' },
    ]);
  });

  it('skips unroutable destinations (null) and malformed bodies', () => {
    expect(parseMatrixResponse({ durations: [[null, 600]], distances: [[null, 9]] }, [a, b])).toEqual([
      { resortId: 'b', minutes: 10, miles: 9, method: 'routing' },
    ]);
    expect(parseMatrixResponse({ error: 'x' }, [a, b])).toEqual([]);
  });
});

describe('fetchDriveTimes', () => {
  it('calls the ORS matrix endpoint with the key and parses the result', async () => {
    const fetchMock = vi.fn(async () => Response.json({ durations: [[600, 1200]], distances: [[10, 20]] }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchDriveTimes({ lat: 42, lng: -71 }, [a, b], 'secret-key');
    expect(result.map((e) => e.minutes)).toEqual([10, 20]);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.openrouteservice.org/v2/matrix/driving-car');
    expect((init.headers as Record<string, string>).Authorization).toBe('secret-key');
  });

  it('splits more than 49 destinations into several requests', async () => {
    const many = Array.from({ length: 60 }, (_, i) =>
      makeResort({ id: `r${i}`, location: { state: 'VT', lat: 44, lng: -72 } }),
    );
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const n = JSON.parse(init.body as string).destinations.length;
      return Response.json({ durations: [Array(n).fill(60)], distances: [Array(n).fill(1)] });
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchDriveTimes({ lat: 42, lng: -71 }, many, 'k');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(60);
  });

  it('throws on an error response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('quota exceeded', { status: 429 })));
    await expect(fetchDriveTimes({ lat: 42, lng: -71 }, [a], 'k')).rejects.toThrow(/429/);
  });
});
