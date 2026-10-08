import type { SkiResort } from '@/lib/types';

/** Minimal valid resort for unit tests. Nested objects in `overrides` replace the defaults wholesale. */
export function makeResort(overrides: Partial<SkiResort> = {}): SkiResort {
  return {
    id: 'test-resort',
    name: 'Test Resort',
    location: { state: 'VT', lat: 44, lng: -72.5 },
    stats: {},
    features: {},
    links: {},
    meta: { lastVerified: '2026-10-08', sources: [] },
    ...overrides,
  };
}
