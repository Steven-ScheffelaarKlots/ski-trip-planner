import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESORTS } from '@/data/resorts';

const post = (body: unknown) =>
  new Request('http://localhost/api/travel', { method: 'POST', body: JSON.stringify(body) });

async function loadRoute() {
  vi.resetModules(); // fresh in-memory cache per test
  return import('@/app/api/travel/route');
}

const orsOk = () =>
  vi.fn(async (_url: string, init: RequestInit) => {
    const n = JSON.parse(init.body as string).destinations.length;
    return Response.json({ durations: [Array(n).fill(3600)], distances: [Array(n).fill(50)] });
  });

beforeEach(() => vi.stubEnv('ORS_API_KEY', 'test-key'));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('POST /api/travel', () => {
  it('reports not-configured without an API key', async () => {
    vi.stubEnv('ORS_API_KEY', '');
    const { POST } = await loadRoute();
    const res = await POST(post({ lat: 42.28, lng: -71.35 }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'not-configured' });
  });

  it('rejects an invalid origin', async () => {
    const { POST } = await loadRoute();
    expect((await POST(post({ lat: 'x' }))).status).toBe(400);
    expect((await POST(new Request('http://localhost/api/travel', { method: 'POST', body: '{' }))).status).toBe(400);
  });

  it('returns routed estimates for every resort', async () => {
    vi.stubGlobal('fetch', orsOk());
    const { POST } = await loadRoute();
    const res = await POST(post({ lat: 42.28, lng: -71.35 }));
    expect(res.status).toBe(200);
    const { estimates } = await res.json();
    expect(estimates).toHaveLength(RESORTS.length);
    expect(estimates[0]).toMatchObject({ minutes: 60, miles: 50, method: 'routing' });
  });

  it('caches by rounded origin so nearby requests do not hit the API again', async () => {
    const fetchMock = orsOk();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await loadRoute();
    await POST(post({ lat: 42.2812, lng: -71.3491 }));
    await POST(post({ lat: 42.2788, lng: -71.3456 }));
    const calls = fetchMock.mock.calls.length;
    await POST(post({ lat: 44.5, lng: -72.7 }));
    expect(fetchMock.mock.calls.length).toBe(calls * 2);
  });

  it('returns 502 when the routing API fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('quota exceeded', { status: 429 })));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { POST } = await loadRoute();
    expect((await POST(post({ lat: 42.28, lng: -71.35 }))).status).toBe(502);
  });
});
