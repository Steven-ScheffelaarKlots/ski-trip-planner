# New England Ski Resort Explorer MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A client-side Next.js app that shows ~48 curated New England ski resorts on a clustered MapLibre map with a filter panel, a synced resort list, a details panel, and ZIP/geolocation-based straight-line distances.

**Architecture:** One Next.js App Router page that renders a client-only `ResortExplorer`. Resort, pass, and rating data are typed TypeScript modules bundled into the app. All logic (filters, sorting, distance, ZIP lookup) lives in pure, unit-tested functions under `src/lib`; React components only compose them. No backend, no route handlers, no database.

**Tech Stack:** Next.js 16.4 (App Router, Turbopack), React 19.3, TypeScript (strict), Tailwind CSS v4, shadcn/ui (Radix base, "nova" preset), `maplibre-gl` 6 + `react-map-gl` 8 (`react-map-gl/maplibre`), `vaul` (mobile bottom sheet), Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-08-ski-resort-mvp-design.md`

## Global Constraints

- Node 22; `next@16.4.0`, `react@19.3.0`; TypeScript strict mode.
- No database, no authentication, no separate backend, no Next.js route handlers in the MVP.
- US units: miles and feet.
- Distances are labeled "straight-line". No drive times are displayed anywhere.
- Unknown or unverifiable values are **omitted**, never guessed. Subjective ratings are never invented; `ratings.ts` ships empty.
- Dataset inclusion rule: currently operating New England alpine areas with **≥ 500 ft vertical**.
- Pass affiliations are tagged with season; current season is `'2026-27'`.
- The map style URL appears only in `src/lib/config.ts` (`MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'`).
- Every `localStorage` access is wrapped in `try/catch`; the app must work without storage.
- `next.config.ts` uses `output: 'standalone'`; no host-specific (Vercel/Amplify) features.
- Commit messages: plain messages only. **Never** add `Co-Authored-By: Claude`, "Generated with Claude Code", or any AI attribution.
- Trail maps are linked, never hosted or embedded.

## Review Focus

1. **Range filter at full extent with missing stats** — a resort with no `skiableAcres` must stay visible until the user actually narrows the acreage slider. Pinned in Task 3 (`apply.test.ts`: "range filter at full extent keeps resorts missing the stat").
2. **Distance filter without a location** — if a distance value is set but there is no location (cleared, or never set), the distance filter must be ignored, not hide every resort. Pinned in Task 3 (`apply.test.ts`: "distance filter is ignored when there is no location").
3. **ZIP input variants** — `" 01760 "` and `"01760-1234"` must work; `"1760"`, `"abcde"`, and a non-New-England ZIP like `"10001"` must produce distinct, helpful messages. Pinned in Task 2 (`geocode.test.ts`).
4. **Stale pass seasons** — a resort whose only Epic entry is for `'2025-26'` must not match the Epic filter or show an Epic badge. Pinned in Task 2 (`resort.test.ts`: "buildPassIndex ignores other seasons").
5. **Sorting with missing data** — sorting by vertical/trails puts resorts missing that stat last; sorting by distance without a location falls back to name order. Pinned in Task 3 (`sort.test.ts`).

---

## File Map

```
next.config.ts                     output: 'standalone'
vitest.config.mts                  Vitest config with '@' alias
scripts/build-zip-centroids.mjs    one-off: Census ZCTA file → src/data/zip-centroids.json
src/
  app/layout.tsx                   metadata, fonts
  app/page.tsx                     renders <ExplorerLoader/>
  components/
    ExplorerLoader.tsx             client-only dynamic import of ResortExplorer
    ResortExplorer.tsx             top-level state + layout (desktop/mobile)
    map/ResortMap.tsx              MapLibre map, clustering, hover, selection, user marker
    resorts/ResortDetails.tsx      details content
    resorts/TerrainBar.tsx         stacked terrain-percentage bar
    resorts/ResortList.tsx         sort control + list + empty state
    resorts/ResortCard.tsx         one list row
    filters/FilterPanel.tsx        renders FilterDefinition[] into controls
    location/LocationInput.tsx     ZIP form + "use my location"
    layout/MobileSheet.tsx         vaul bottom sheet with snap points
    ui/*                           shadcn components (generated)
  hooks/
    useResortFilters.ts            filter state
    useUserLocation.ts             ZIP/geolocation + persistence
    useTravelEstimates.ts          location → Map<resortId, TravelEstimate>
    useIsDesktop.ts                matchMedia via useSyncExternalStore
  data/
    resorts/{vermont,new-hampshire,maine,massachusetts,connecticut}.ts
    resorts/index.ts               RESORTS
    passes.ts                      PASSES
    pass-affiliations.ts           PASS_AFFILIATIONS
    ratings.ts                     RATINGS (empty)
    zip-centroids.json             { "01760": [42.2848, -71.3488], ... }
    data.test.ts                   data validation
  lib/
    types.ts                       domain types
    config.ts                      constants
    resort.ts (+test)              size class, pass index, labels
    format.ts (+test)              display formatting
    test-fixtures.ts               makeResort() for tests
    geo/distance.ts (+test)        haversineMiles
    geo/geocode.ts (+test)         normalizeZip, resolveZip, loadZipTable
    geo/stored-location.ts (+test) parse/serialize persisted location
    geo/travel.ts (+test)          TravelEstimator + straightLineEstimator
    filters/types.ts               FilterDefinition, FilterState, FilterContext
    filters/definitions.ts (+test) buildFilters(resorts, passes)
    filters/apply.ts (+test)       isFilterActive, matchesFilter, applyFilters, activeFilterCount
    sort.ts (+test)                sortResorts
```

---

### Task 1: Scaffold, domain types, seed data, data validation

**Files:**
- Create: whole Next.js scaffold (via `create-next-app`), `vitest.config.mts`, `src/lib/types.ts`, `src/lib/config.ts`, `src/data/resorts/*.ts`, `src/data/passes.ts`, `src/data/pass-affiliations.ts`, `src/data/ratings.ts`, `src/data/data.test.ts`
- Modify: `next.config.ts`, `package.json`, `src/app/page.tsx`, `src/app/layout.tsx`, `README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: all types in `@/lib/types` (exact definitions below); `@/lib/config` constants `MAP_STYLE_URL`, `NEW_ENGLAND_BOUNDS`, `SIZE_THRESHOLDS_FT`, `CURRENT_SEASON`, `BEGINNER_TERRAIN_MIN_PCT`, `EXPERT_TERRAIN_MIN_PCT`, `MIN_VERTICAL_FT`; data exports `RESORTS`, `PASSES`, `PASS_AFFILIATIONS`, `RATINGS`.

- [ ] **Step 1: Scaffold Next.js into the existing repo**

The repo already contains `.git` and `docs/`, so scaffold in a temp dir and copy in:

```bash
TMP=$(mktemp -d)
(cd "$TMP" && CI=1 npx -y create-next-app@16.4.0 app --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --disable-git --no-agent-feedback --yes)
rsync -a --exclude node_modules --exclude .next "$TMP/app/" ./
rm -rf "$TMP"
npm pkg set name=ski-trip-planner
npm install
```

Expected: `package.json`, `src/app/`, `AGENTS.md`, `eslint.config.mjs`, `tsconfig.json` now exist at the repo root; `docs/` untouched.

- [ ] **Step 2: Add shadcn/ui and libraries**

```bash
CI=1 npx -y shadcn@4.21.4 init -b radix -p nova -y --no-monorepo < /dev/null
CI=1 npx -y shadcn@4.21.4 add slider checkbox sheet button input badge -y < /dev/null
npm i maplibre-gl@^6 react-map-gl@^8 vaul@^1
npm i -D vitest@^5 @types/node@^22 @types/geojson
```

(`@types/node@^22` is required: Vitest 5's peer range excludes the scaffold's `@types/node@20`.)

Expected: `components.json`, `src/lib/utils.ts`, and `src/components/ui/{slider,checkbox,sheet,button,input,badge}.tsx` exist.

- [ ] **Step 3: Configure Next.js output and Vitest**

Replace `next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

Create `vitest.config.mts`:

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
```

```bash
npm pkg set scripts.test="vitest run" scripts.test:watch="vitest"
```

- [ ] **Step 4: Write domain types**

Create `src/lib/types.ts`:

```ts
export type StateCode = 'VT' | 'NH' | 'ME' | 'MA' | 'CT' | 'RI';

export type LatLng = { lat: number; lng: number };

export type SourceRef = {
  label: string;
  url: string;
  /** ISO date, e.g. '2026-10-08' */
  retrievedAt: string;
};

export type TrailMapRef = {
  url: string;
  kind: 'page' | 'pdf' | 'image';
  /** MVP: always 'link-only'. 'embeddable' only with explicit permission. */
  license: 'link-only' | 'embeddable';
};

/** Percentages 0–100. If a resort reports only a combined "black" figure, it goes in `advanced`. */
export type TerrainBreakdown = {
  basis: 'trails' | 'acreage';
  beginner?: number;
  intermediate?: number;
  advanced?: number;
  expert?: number;
};

export type ResortStats = {
  trailCount?: number;
  skiableAcres?: number;
  verticalFt?: number;
  summitElevationFt?: number;
  baseElevationFt?: number;
  liftCount?: number;
};

export type ResortFeatures = {
  nightSkiing?: boolean;
  terrainPark?: boolean;
  snowmakingPercent?: number;
};

export type SkiResort = {
  /** Stable kebab-case slug, e.g. 'pleasant-mountain'. Never reuse or rename. */
  id: string;
  name: string;
  formerNames?: string[];
  location: LatLng & { state: StateCode; town?: string };
  stats: ResortStats;
  terrain?: TerrainBreakdown;
  features: ResortFeatures;
  links: { website?: string; trailMaps?: TrailMapRef[] };
  /** Short and factual. No subjective claims. */
  description?: string;
  meta: { lastVerified: string; sources: SourceRef[] };
};

export type PassId = 'epic' | 'ikon' | 'indy' | 'mountain-collective' | (string & {});

export type Pass = { id: PassId; name: string; website: string };

export type PassAccess = 'unlimited' | 'limited' | 'days';

export type PassAffiliation = {
  resortId: string;
  passId: PassId;
  /** e.g. '2026-27' */
  season: string;
  access: PassAccess;
  /** Required when access === 'days'. */
  days?: number;
  notes?: string;
  source: SourceRef;
};

export type RatingAttribute =
  | 'beginnerFriendly'
  | 'expertFriendly'
  | 'apres'
  | 'nightlife'
  | 'familyFriendly'
  | 'terrainVariety'
  | 'snowQuality'
  | 'crowding'
  | 'atmosphere';

export type RatingMethod = 'editorial' | 'aggregated-reviews' | 'llm-summary';

export type ResortRating = {
  resortId: string;
  attribute: RatingAttribute;
  /** 1–5 */
  value: number;
  method: RatingMethod;
  sources: SourceRef[];
  asOf: string;
};

export type TravelEstimate = {
  resortId: string;
  miles: number;
  /** Only populated by a routing provider. */
  minutes?: number;
  method: 'straight-line' | 'routing';
};
```

- [ ] **Step 5: Write config constants**

Create `src/lib/config.ts`:

```ts
/** The only place the map tile provider is referenced. */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Generous bounding box around New England (used for the initial map view and data validation). */
export const NEW_ENGLAND_BOUNDS = { south: 40.9, west: -73.8, north: 47.5, east: -66.9 } as const;

/** Size class by vertical drop: small < medium ≤ … < large ≤ … */
export const SIZE_THRESHOLDS_FT = { medium: 1000, large: 2000 } as const;

export const CURRENT_SEASON = '2026-27';

export const BEGINNER_TERRAIN_MIN_PCT = 20;
export const EXPERT_TERRAIN_MIN_PCT = 15;

/** Dataset inclusion rule (see spec §6). */
export const MIN_VERTICAL_FT = 500;
```

- [ ] **Step 6: Write the failing data validation test**

Create `src/data/data.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { RESORTS } from '@/data/resorts';
import { PASSES } from '@/data/passes';
import { PASS_AFFILIATIONS } from '@/data/pass-affiliations';
import { RATINGS } from '@/data/ratings';
import { MIN_VERTICAL_FT, NEW_ENGLAND_BOUNDS } from '@/lib/config';
import type { SourceRef } from '@/lib/types';

const isHttps = (url: string) => {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
};
const isIsoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const validSource = (s: SourceRef) => s.label.length > 0 && isHttps(s.url) && isIsoDate(s.retrievedAt);

describe('resorts', () => {
  it('has at least one resort', () => {
    expect(RESORTS.length).toBeGreaterThan(0);
  });

  it('has unique kebab-case ids', () => {
    const ids = RESORTS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(RESORTS.map((r) => [r.id, r] as const))('%s has valid location, stats, terrain, links, meta', (_id, r) => {
    const { lat, lng } = r.location;
    expect(lat).toBeGreaterThanOrEqual(NEW_ENGLAND_BOUNDS.south);
    expect(lat).toBeLessThanOrEqual(NEW_ENGLAND_BOUNDS.north);
    expect(lng).toBeGreaterThanOrEqual(NEW_ENGLAND_BOUNDS.west);
    expect(lng).toBeLessThanOrEqual(NEW_ENGLAND_BOUNDS.east);

    for (const value of Object.values(r.stats)) {
      expect(Number.isFinite(value) && value > 0).toBe(true);
    }
    if (r.stats.verticalFt !== undefined) expect(r.stats.verticalFt).toBeGreaterThanOrEqual(MIN_VERTICAL_FT);
    if (r.stats.summitElevationFt !== undefined && r.stats.baseElevationFt !== undefined) {
      expect(r.stats.summitElevationFt).toBeGreaterThan(r.stats.baseElevationFt);
    }

    if (r.terrain) {
      const { beginner, intermediate, advanced, expert } = r.terrain;
      const reported = [beginner, intermediate, advanced, expert].filter((v): v is number => v !== undefined);
      for (const v of reported) expect(v >= 0 && v <= 100).toBe(true);
      if (beginner !== undefined && intermediate !== undefined && advanced !== undefined) {
        const sum = reported.reduce((a, b) => a + b, 0);
        expect(sum).toBeGreaterThanOrEqual(95);
        expect(sum).toBeLessThanOrEqual(105);
      }
    }

    if (r.features.snowmakingPercent !== undefined) {
      expect(r.features.snowmakingPercent >= 0 && r.features.snowmakingPercent <= 100).toBe(true);
    }

    if (r.links.website) expect(isHttps(r.links.website)).toBe(true);
    for (const map of r.links.trailMaps ?? []) {
      expect(isHttps(map.url)).toBe(true);
      expect(map.license).toBe('link-only');
    }

    expect(isIsoDate(r.meta.lastVerified)).toBe(true);
    expect(r.meta.sources.length).toBeGreaterThan(0);
    for (const s of r.meta.sources) expect(validSource(s)).toBe(true);
  });
});

describe('passes and affiliations', () => {
  const resortIds = new Set(RESORTS.map((r) => r.id));
  const passIds = new Set(PASSES.map((p) => p.id));

  it('has unique pass ids with https websites', () => {
    expect(passIds.size).toBe(PASSES.length);
    for (const p of PASSES) expect(isHttps(p.website)).toBe(true);
  });

  it('references existing resorts and passes, with valid season and access', () => {
    for (const a of PASS_AFFILIATIONS) {
      expect(resortIds.has(a.resortId), `unknown resort ${a.resortId}`).toBe(true);
      expect(passIds.has(a.passId), `unknown pass ${a.passId}`).toBe(true);
      expect(a.season).toMatch(/^\d{4}-\d{2}$/);
      if (a.access === 'days') expect(a.days).toBeGreaterThan(0);
      else expect(a.days).toBeUndefined();
      expect(validSource(a.source)).toBe(true);
    }
  });

  it('has no duplicate resort/pass/season entries', () => {
    const keys = PASS_AFFILIATIONS.map((a) => `${a.resortId}|${a.passId}|${a.season}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('ratings', () => {
  const resortIds = new Set(RESORTS.map((r) => r.id));

  it('every rating is in range, references a resort, and has sources', () => {
    for (const r of RATINGS) {
      expect(resortIds.has(r.resortId)).toBe(true);
      expect(r.value >= 1 && r.value <= 5).toBe(true);
      expect(r.sources.length).toBeGreaterThan(0);
      for (const s of r.sources) expect(validSource(s)).toBe(true);
      expect(isIsoDate(r.asOf)).toBe(true);
    }
  });
});
```

- [ ] **Step 7: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "@/data/resorts"`.

- [ ] **Step 8: Create pass registry, empty ratings, and seed resort files**

Create `src/data/passes.ts`:

```ts
import type { Pass } from '@/lib/types';

export const PASSES: Pass[] = [
  { id: 'epic', name: 'Epic Pass', website: 'https://www.epicpass.com' },
  { id: 'ikon', name: 'Ikon Pass', website: 'https://www.ikonpass.com' },
  { id: 'indy', name: 'Indy Pass', website: 'https://www.indyskipass.com' },
  { id: 'mountain-collective', name: 'Mountain Collective', website: 'https://mountaincollective.com' },
];
```

Create `src/data/ratings.ts`:

```ts
import type { ResortRating } from '@/lib/types';

/**
 * Subjective ratings. Intentionally empty for the MVP.
 * Every entry must carry a method and at least one source — never add unsourced values.
 */
export const RATINGS: ResortRating[] = [];
```

Create `src/data/resorts/vermont.ts` (values are **drafts to verify in Step 10**):

```ts
import type { SkiResort } from '@/lib/types';

export const VERMONT_RESORTS: SkiResort[] = [
  {
    id: 'killington',
    name: 'Killington',
    location: { state: 'VT', town: 'Killington', lat: 43.6262, lng: -72.7967 },
    stats: { trailCount: 155, skiableAcres: 1509, verticalFt: 3050, summitElevationFt: 4241, liftCount: 22 },
    features: { nightSkiing: false },
    links: {
      website: 'https://www.killington.com',
      trailMaps: [{ url: 'https://www.killington.com', kind: 'page', license: 'link-only' }],
    },
    description: 'The largest ski area in the eastern US, spread across six peaks in central Vermont.',
    meta: {
      lastVerified: '2026-10-08',
      sources: [{ label: 'Killington official site', url: 'https://www.killington.com', retrievedAt: '2026-10-08' }],
    },
  },
  {
    id: 'stowe',
    name: 'Stowe',
    location: { state: 'VT', town: 'Stowe', lat: 44.53, lng: -72.7835 },
    stats: { trailCount: 116, skiableAcres: 485, verticalFt: 2360, summitElevationFt: 3719, liftCount: 12 },
    features: { nightSkiing: false },
    links: {
      website: 'https://www.stowe.com',
      trailMaps: [{ url: 'https://www.stowe.com', kind: 'page', license: 'link-only' }],
    },
    description: "Ski resort on Mount Mansfield, Vermont's highest peak, and neighboring Spruce Peak.",
    meta: {
      lastVerified: '2026-10-08',
      sources: [{ label: 'Stowe official site', url: 'https://www.stowe.com', retrievedAt: '2026-10-08' }],
    },
  },
];
```

Create `src/data/resorts/maine.ts`:

```ts
import type { SkiResort } from '@/lib/types';

export const MAINE_RESORTS: SkiResort[] = [
  {
    id: 'sunday-river',
    name: 'Sunday River',
    location: { state: 'ME', town: 'Newry', lat: 44.4733, lng: -70.8573 },
    stats: { trailCount: 135, skiableAcres: 870, verticalFt: 2340, summitElevationFt: 3150, liftCount: 18 },
    features: { nightSkiing: false },
    links: {
      website: 'https://www.sundayriver.com',
      trailMaps: [{ url: 'https://www.sundayriver.com', kind: 'page', license: 'link-only' }],
    },
    description: 'Ski resort spanning eight interconnected peaks near Bethel in western Maine.',
    meta: {
      lastVerified: '2026-10-08',
      sources: [{ label: 'Sunday River official site', url: 'https://www.sundayriver.com', retrievedAt: '2026-10-08' }],
    },
  },
];
```

Create `src/data/resorts/massachusetts.ts`:

```ts
import type { SkiResort } from '@/lib/types';

export const MASSACHUSETTS_RESORTS: SkiResort[] = [
  {
    id: 'wachusett',
    name: 'Wachusett Mountain',
    location: { state: 'MA', town: 'Princeton', lat: 42.5035, lng: -71.8866 },
    stats: { trailCount: 27, skiableAcres: 110, verticalFt: 1000, summitElevationFt: 2006, liftCount: 8 },
    features: { nightSkiing: true },
    links: {
      website: 'https://www.wachusett.com',
      trailMaps: [{ url: 'https://www.wachusett.com', kind: 'page', license: 'link-only' }],
    },
    description: 'Ski area in central Massachusetts, about an hour west of Boston, with night skiing.',
    meta: {
      lastVerified: '2026-10-08',
      sources: [{ label: 'Wachusett official site', url: 'https://www.wachusett.com', retrievedAt: '2026-10-08' }],
    },
  },
];
```

Create `src/data/resorts/new-hampshire.ts`:

```ts
import type { SkiResort } from '@/lib/types';

export const NEW_HAMPSHIRE_RESORTS: SkiResort[] = [];
```

Create `src/data/resorts/connecticut.ts`:

```ts
import type { SkiResort } from '@/lib/types';

export const CONNECTICUT_RESORTS: SkiResort[] = [];
```

Create `src/data/resorts/index.ts`:

```ts
import type { SkiResort } from '@/lib/types';
import { CONNECTICUT_RESORTS } from './connecticut';
import { MAINE_RESORTS } from './maine';
import { MASSACHUSETTS_RESORTS } from './massachusetts';
import { NEW_HAMPSHIRE_RESORTS } from './new-hampshire';
import { VERMONT_RESORTS } from './vermont';

export const RESORTS: SkiResort[] = [
  ...VERMONT_RESORTS,
  ...NEW_HAMPSHIRE_RESORTS,
  ...MAINE_RESORTS,
  ...MASSACHUSETTS_RESORTS,
  ...CONNECTICUT_RESORTS,
];
```

Create `src/data/pass-affiliations.ts` (drafts to verify in Step 10):

```ts
import type { PassAffiliation } from '@/lib/types';

const ikon2627 = { label: 'Ikon Pass destinations', url: 'https://www.ikonpass.com', retrievedAt: '2026-10-08' };
const epic2627 = { label: 'Epic Pass resorts', url: 'https://www.epicpass.com', retrievedAt: '2026-10-08' };

export const PASS_AFFILIATIONS: PassAffiliation[] = [
  { resortId: 'killington', passId: 'ikon', season: '2026-27', access: 'unlimited', source: ikon2627 },
  { resortId: 'sunday-river', passId: 'ikon', season: '2026-27', access: 'unlimited', source: ikon2627 },
  { resortId: 'stowe', passId: 'epic', season: '2026-27', access: 'unlimited', source: epic2627 },
];
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `npm test`
Expected: PASS (all tests in `src/data/data.test.ts`).

- [ ] **Step 10: Verify seed values against real sources**

For each of the 4 seed resorts and 3 affiliations:
1. Open the resort's official site; find the mountain-stats page and the official trail map page/PDF.
2. Correct any stat that differs from the official figure. **Delete** any stat the official site (or, failing that, Wikipedia/OnTheSnow) does not state. Add `terrain` (with the correct `basis`) and `baseElevationFt` if the resort publishes them.
3. Replace the placeholder `trailMaps[0].url` with the actual trail-map URL (set `kind` to `'pdf'` if it is a PDF), and replace each `meta.sources` entry with the specific stats page URL(s) used.
4. Get coordinates of the main base lodge from OpenStreetMap (right-click → "Show address" or the URL `#map=` values); round to 4 decimals.
5. Verify 2026-27 pass membership and access level on the official Epic/Ikon pages; set `source.url` to the specific resort/destination page. Remove any affiliation you cannot confirm.

Run: `npm test`
Expected: PASS.

- [ ] **Step 11: Replace boilerplate page, metadata, README**

Replace `src/app/page.tsx`:

```tsx
import { RESORTS } from '@/data/resorts';

export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center p-8">
      <p className="text-muted-foreground">{RESORTS.length} resorts loaded.</p>
    </main>
  );
}
```

In `src/app/layout.tsx`, change only the metadata:

```ts
export const metadata: Metadata = {
  title: 'New England Ski Resort Explorer',
  description: 'Compare New England ski resorts by location, size, terrain, and pass.',
};
```

Replace `README.md`:

````markdown
# New England Ski Resort Explorer

Compare New England ski resorts on a map by location, size, terrain, and pass.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # unit + data validation tests
npm run lint
npm run build
```

Design: `docs/superpowers/specs/2026-10-08-ski-resort-mvp-design.md`

## Adding a resort

Add an object to the matching file in `src/data/resorts/`, add any pass entries to
`src/data/pass-affiliations.ts`, and run `npm test`. Omit any value you cannot verify.
````

- [ ] **Step 12: Verify build, lint, tests**

Run: `npm test && npm run lint && npm run build`
Expected: tests pass, lint reports no errors, build succeeds. `npm run dev` shows "4 resorts loaded." (or the verified count).

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js app with domain types, seed resort data, and data validation"
```

---

### Task 2: Domain logic — resort helpers, formatting, geo, ZIP data

**Files:**
- Create: `src/lib/test-fixtures.ts`, `src/lib/resort.ts`, `src/lib/resort.test.ts`, `src/lib/format.ts`, `src/lib/format.test.ts`, `src/lib/geo/distance.ts`, `src/lib/geo/distance.test.ts`, `src/lib/geo/geocode.ts`, `src/lib/geo/geocode.test.ts`, `src/lib/geo/stored-location.ts`, `src/lib/geo/stored-location.test.ts`, `src/lib/geo/travel.ts`, `src/lib/geo/travel.test.ts`, `scripts/build-zip-centroids.mjs`, `src/data/zip-centroids.json`

**Interfaces:**
- Consumes: `@/lib/types`, `@/lib/config` (Task 1).
- Produces:
  - `makeResort(overrides?: Partial<SkiResort>): SkiResort` (tests only)
  - `type SizeClass = 'small' | 'medium' | 'large'`; `sizeClass(r: SkiResort): SizeClass | undefined`; `SIZE_LABELS: Record<SizeClass, string>`; `STATE_NAMES: Record<StateCode, string>`; `RATING_LABELS: Record<RatingAttribute, string>`
  - `buildPassIndex(affiliations: PassAffiliation[], season: string): Map<string, PassId[]>`; `affiliationsFor(resortId: string, affiliations: PassAffiliation[], season: string): PassAffiliation[]`
  - `formatNumber(n?: number): string`; `withUnit(n: number | undefined, unit: string): string`; `formatMiles(miles: number): string`; `formatCoords(p: LatLng): string`; `passAccessLabel(a: PassAffiliation): string`; `yesNo(v?: boolean): string`
  - `haversineMiles(a: LatLng, b: LatLng): number`
  - `type ZipTable = Record<string, [number, number]>`; `normalizeZip(input: string): string | null`; `type ZipResult = { ok: true; zip: string; coords: LatLng } | { ok: false; error: string }`; `resolveZip(input: string, table: ZipTable): ZipResult`; `loadZipTable(): Promise<ZipTable>`
  - `type UserLocation = { label: string; coords: LatLng }`; `parseStoredLocation(raw: string | null): UserLocation | null`; `LOCATION_STORAGE_KEY = 'ski-trip-planner:location'`
  - `interface TravelEstimator { estimate(origin: LatLng, resorts: SkiResort[]): Promise<TravelEstimate[]> }`; `straightLineEstimator: TravelEstimator`

- [ ] **Step 1: Create the test fixture helper**

Create `src/lib/test-fixtures.ts`:

```ts
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
```

- [ ] **Step 2: Write failing tests for resort helpers and formatting**

Create `src/lib/resort.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { affiliationsFor, buildPassIndex, sizeClass } from '@/lib/resort';
import { makeResort } from '@/lib/test-fixtures';
import type { PassAffiliation } from '@/lib/types';

const src = { label: 's', url: 'https://example.com', retrievedAt: '2026-10-08' };

describe('sizeClass', () => {
  it('classifies by vertical drop', () => {
    expect(sizeClass(makeResort({ stats: { verticalFt: 999 } }))).toBe('small');
    expect(sizeClass(makeResort({ stats: { verticalFt: 1000 } }))).toBe('medium');
    expect(sizeClass(makeResort({ stats: { verticalFt: 1999 } }))).toBe('medium');
    expect(sizeClass(makeResort({ stats: { verticalFt: 2000 } }))).toBe('large');
  });

  it('is undefined without a vertical', () => {
    expect(sizeClass(makeResort())).toBeUndefined();
  });
});

describe('pass index', () => {
  const affiliations: PassAffiliation[] = [
    { resortId: 'a', passId: 'ikon', season: '2026-27', access: 'unlimited', source: src },
    { resortId: 'a', passId: 'indy', season: '2026-27', access: 'days', days: 2, source: src },
    { resortId: 'b', passId: 'epic', season: '2025-26', access: 'unlimited', source: src },
  ];

  it('groups pass ids by resort for the season', () => {
    const index = buildPassIndex(affiliations, '2026-27');
    expect(index.get('a')).toEqual(['ikon', 'indy']);
  });

  it('buildPassIndex ignores other seasons', () => {
    const index = buildPassIndex(affiliations, '2026-27');
    expect(index.has('b')).toBe(false);
  });

  it('affiliationsFor returns only that resort and season', () => {
    expect(affiliationsFor('a', affiliations, '2026-27').map((a) => a.passId)).toEqual(['ikon', 'indy']);
    expect(affiliationsFor('b', affiliations, '2026-27')).toEqual([]);
  });
});
```

Create `src/lib/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatCoords, formatMiles, formatNumber, passAccessLabel, withUnit, yesNo } from '@/lib/format';

const src = { label: 's', url: 'https://example.com', retrievedAt: '2026-10-08' };

describe('format', () => {
  it('formats numbers with separators and a dash for missing', () => {
    expect(formatNumber(3050)).toBe('3,050');
    expect(formatNumber(undefined)).toBe('—');
    expect(withUnit(1509, 'acres')).toBe('1,509 acres');
    expect(withUnit(undefined, 'ft')).toBe('—');
  });

  it('rounds miles', () => {
    expect(formatMiles(118.16)).toBe('118 mi');
  });

  it('formats coordinates to 4 decimals', () => {
    expect(formatCoords({ lat: 43.62621, lng: -72.79669 })).toBe('43.6262, -72.7967');
  });

  it('labels pass access', () => {
    expect(passAccessLabel({ resortId: 'a', passId: 'ikon', season: '2026-27', access: 'unlimited', source: src })).toBe('Unlimited');
    expect(passAccessLabel({ resortId: 'a', passId: 'ikon', season: '2026-27', access: 'limited', source: src })).toBe('Limited access');
    expect(passAccessLabel({ resortId: 'a', passId: 'indy', season: '2026-27', access: 'days', days: 2, source: src })).toBe('2 days');
    expect(passAccessLabel({ resortId: 'a', passId: 'indy', season: '2026-27', access: 'days', days: 1, source: src })).toBe('1 day');
  });

  it('formats optional booleans', () => {
    expect(yesNo(true)).toBe('Yes');
    expect(yesNo(false)).toBe('No');
    expect(yesNo(undefined)).toBe('Unknown');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `@/lib/resort` and `@/lib/format`.

- [ ] **Step 4: Implement resort helpers and formatting**

Create `src/lib/resort.ts`:

```ts
import { SIZE_THRESHOLDS_FT } from '@/lib/config';
import type { PassAffiliation, PassId, RatingAttribute, SkiResort, StateCode } from '@/lib/types';

export type SizeClass = 'small' | 'medium' | 'large';

export const SIZE_LABELS: Record<SizeClass, string> = {
  small: 'Small (<1,000 ft)',
  medium: 'Medium (1,000–1,999 ft)',
  large: 'Large (2,000+ ft)',
};

export const STATE_NAMES: Record<StateCode, string> = {
  VT: 'Vermont',
  NH: 'New Hampshire',
  ME: 'Maine',
  MA: 'Massachusetts',
  CT: 'Connecticut',
  RI: 'Rhode Island',
};

export const RATING_LABELS: Record<RatingAttribute, string> = {
  beginnerFriendly: 'Beginner friendly',
  expertFriendly: 'Expert friendly',
  apres: 'Après',
  nightlife: 'Nightlife',
  familyFriendly: 'Family friendly',
  terrainVariety: 'Terrain variety',
  snowQuality: 'Snow quality',
  crowding: 'Crowding',
  atmosphere: 'Atmosphere',
};

export function sizeClass(resort: SkiResort): SizeClass | undefined {
  const vertical = resort.stats.verticalFt;
  if (vertical === undefined) return undefined;
  if (vertical >= SIZE_THRESHOLDS_FT.large) return 'large';
  if (vertical >= SIZE_THRESHOLDS_FT.medium) return 'medium';
  return 'small';
}

export function buildPassIndex(affiliations: PassAffiliation[], season: string): Map<string, PassId[]> {
  const index = new Map<string, PassId[]>();
  for (const a of affiliations) {
    if (a.season !== season) continue;
    index.set(a.resortId, [...(index.get(a.resortId) ?? []), a.passId]);
  }
  return index;
}

export function affiliationsFor(resortId: string, affiliations: PassAffiliation[], season: string): PassAffiliation[] {
  return affiliations.filter((a) => a.resortId === resortId && a.season === season);
}
```

Create `src/lib/format.ts`:

```ts
import type { LatLng, PassAffiliation } from '@/lib/types';

export function formatNumber(n?: number): string {
  return n === undefined ? '—' : n.toLocaleString('en-US');
}

export function withUnit(n: number | undefined, unit: string): string {
  return n === undefined ? '—' : `${formatNumber(n)} ${unit}`;
}

export function formatMiles(miles: number): string {
  return `${Math.round(miles).toLocaleString('en-US')} mi`;
}

export function formatCoords({ lat, lng }: LatLng): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function passAccessLabel(a: PassAffiliation): string {
  switch (a.access) {
    case 'unlimited':
      return 'Unlimited';
    case 'limited':
      return 'Limited access';
    case 'days':
      return `${a.days} ${a.days === 1 ? 'day' : 'days'}`;
  }
}

export function yesNo(v?: boolean): string {
  return v === undefined ? 'Unknown' : v ? 'Yes' : 'No';
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Write failing geo tests**

Create `src/lib/geo/distance.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { haversineMiles } from '@/lib/geo/distance';

describe('haversineMiles', () => {
  it('computes Boston → New York City', () => {
    expect(haversineMiles({ lat: 42.3601, lng: -71.0589 }, { lat: 40.7128, lng: -74.006 })).toBeCloseTo(190.21, 1);
  });

  it('is zero for the same point', () => {
    expect(haversineMiles({ lat: 44, lng: -72 }, { lat: 44, lng: -72 })).toBe(0);
  });
});
```

Create `src/lib/geo/geocode.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeZip, resolveZip, type ZipTable } from '@/lib/geo/geocode';

const table: ZipTable = { '01760': [42.2848, -71.3488], '05401': [44.4752, -73.2179] };

describe('normalizeZip', () => {
  it('accepts 5-digit and ZIP+4, trimming whitespace', () => {
    expect(normalizeZip(' 01760 ')).toBe('01760');
    expect(normalizeZip('01760-1234')).toBe('01760');
  });

  it('rejects malformed input', () => {
    expect(normalizeZip('1760')).toBeNull();
    expect(normalizeZip('abcde')).toBeNull();
    expect(normalizeZip('')).toBeNull();
  });
});

describe('resolveZip', () => {
  it('returns coordinates for a known New England ZIP', () => {
    expect(resolveZip('01760-1234', table)).toEqual({ ok: true, zip: '01760', coords: { lat: 42.2848, lng: -71.3488 } });
  });

  it('explains malformed input', () => {
    expect(resolveZip('1760', table)).toEqual({ ok: false, error: 'Enter a 5-digit ZIP code.' });
  });

  it('explains a ZIP outside New England', () => {
    expect(resolveZip('10001', table)).toEqual({
      ok: false,
      error: "That ZIP isn't in New England. Enter a New England ZIP or use your location.",
    });
  });
});
```

Create `src/lib/geo/stored-location.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseStoredLocation } from '@/lib/geo/stored-location';

describe('parseStoredLocation', () => {
  it('parses a valid stored location', () => {
    const raw = JSON.stringify({ label: 'ZIP 01760', coords: { lat: 42.28, lng: -71.35 } });
    expect(parseStoredLocation(raw)).toEqual({ label: 'ZIP 01760', coords: { lat: 42.28, lng: -71.35 } });
  });

  it('returns null for missing, corrupt, or wrong-shaped values', () => {
    expect(parseStoredLocation(null)).toBeNull();
    expect(parseStoredLocation('{not json')).toBeNull();
    expect(parseStoredLocation(JSON.stringify({ label: 'x', coords: { lat: 'a', lng: 1 } }))).toBeNull();
    expect(parseStoredLocation(JSON.stringify({ coords: { lat: 1, lng: 1 } }))).toBeNull();
  });
});
```

Create `src/lib/geo/travel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { straightLineEstimator } from '@/lib/geo/travel';
import { makeResort } from '@/lib/test-fixtures';

describe('straightLineEstimator', () => {
  it('returns straight-line miles and no minutes', async () => {
    const killington = makeResort({ id: 'killington', location: { state: 'VT', lat: 43.6262, lng: -72.7967 } });
    const [estimate] = await straightLineEstimator.estimate({ lat: 42.2835, lng: -71.3495 }, [killington]);
    expect(estimate.resortId).toBe('killington');
    expect(estimate.method).toBe('straight-line');
    expect(estimate.minutes).toBeUndefined();
    expect(estimate.miles).toBeCloseTo(118.16, 1);
  });
});
```

- [ ] **Step 7: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve the four `@/lib/geo/*` modules.

- [ ] **Step 8: Implement geo modules**

Create `src/lib/geo/distance.ts`:

```ts
import type { LatLng } from '@/lib/types';

const EARTH_RADIUS_MILES = 3958.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle ("straight-line") distance in miles. */
export function haversineMiles(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}
```

Create `src/lib/geo/geocode.ts`:

```ts
import type { LatLng } from '@/lib/types';

/** ZIP → [lat, lng]. Generated by scripts/build-zip-centroids.mjs. */
export type ZipTable = Record<string, [number, number]>;

export type ZipResult = { ok: true; zip: string; coords: LatLng } | { ok: false; error: string };

export function normalizeZip(input: string): string | null {
  const match = input.trim().match(/^(\d{5})(?:-\d{4})?$/);
  return match ? match[1] : null;
}

export function resolveZip(input: string, table: ZipTable): ZipResult {
  const zip = normalizeZip(input);
  if (!zip) return { ok: false, error: 'Enter a 5-digit ZIP code.' };
  const entry = table[zip];
  if (!entry) {
    return { ok: false, error: "That ZIP isn't in New England. Enter a New England ZIP or use your location." };
  }
  return { ok: true, zip, coords: { lat: entry[0], lng: entry[1] } };
}

/** Lazy-loaded so the ~40 KB table is only fetched when a ZIP is entered. */
export async function loadZipTable(): Promise<ZipTable> {
  const mod = await import('@/data/zip-centroids.json');
  return mod.default as ZipTable;
}
```

Create `src/lib/geo/stored-location.ts`:

```ts
import type { LatLng } from '@/lib/types';

export type UserLocation = { label: string; coords: LatLng };

export const LOCATION_STORAGE_KEY = 'ski-trip-planner:location';

export function parseStoredLocation(raw: string | null): UserLocation | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const { label, coords } = value as { label?: unknown; coords?: { lat?: unknown; lng?: unknown } };
    if (typeof label !== 'string' || typeof coords?.lat !== 'number' || typeof coords?.lng !== 'number') return null;
    return { label, coords: { lat: coords.lat, lng: coords.lng } };
  } catch {
    return null;
  }
}
```

Create `src/lib/geo/travel.ts`:

```ts
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
```

- [ ] **Step 9: Generate the ZIP centroid table**

Create `scripts/build-zip-centroids.mjs`:

```js
// Usage: node scripts/build-zip-centroids.mjs <path-to-Gaz_zcta_national.txt>
// Source: US Census Bureau Gazetteer (ZCTA), public domain. Keeps New England ZIPs (prefixes 010–069).
import { readFileSync, writeFileSync } from 'node:fs';

const [input] = process.argv.slice(2);
if (!input) {
  console.error('Usage: node scripts/build-zip-centroids.mjs <Gaz_zcta_national.txt>');
  process.exit(1);
}

const lines = readFileSync(input, 'utf8').trim().split(/\r?\n/);
const header = lines[0].split('|').map((h) => h.trim());
const iZip = header.indexOf('GEOID');
const iLat = header.indexOf('INTPTLAT');
const iLng = header.indexOf('INTPTLONG');
if ([iZip, iLat, iLng].includes(-1)) throw new Error(`Unexpected header: ${lines[0]}`);

const table = {};
for (const line of lines.slice(1)) {
  const cols = line.split('|');
  const zip = cols[iZip].trim();
  if (!/^0[1-6]\d{3}$/.test(zip)) continue;
  table[zip] = [Number(Number(cols[iLat]).toFixed(4)), Number(Number(cols[iLng]).toFixed(4))];
}

writeFileSync('src/data/zip-centroids.json', JSON.stringify(table) + '\n');
console.log(`Wrote ${Object.keys(table).length} ZIPs to src/data/zip-centroids.json`);
```

Download into an isolated temp dir and run from the repo root:

```bash
D=$(mktemp -d)
curl -sSfo "$D/zcta.zip" https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_Gaz_zcta_national.zip
unzip -q "$D/zcta.zip" -d "$D"
node scripts/build-zip-centroids.mjs "$D/2025_Gaz_zcta_national.txt"
rm -rf "$D"
```

Expected: `Wrote 1847 ZIPs to src/data/zip-centroids.json` (±a few). Spot-check: `grep -o '"01760":\[[^]]*\]' src/data/zip-centroids.json` → `"01760":[42.2848,-71.3488]`.

- [ ] **Step 10: Run tests, typecheck, and commit**

Run: `npm test && npx tsc --noEmit`
Expected: all PASS, no type errors (the JSON import in `loadZipTable` type-checks because `resolveJsonModule` is on in the scaffold's tsconfig).

```bash
git add -A
git commit -m "Add resort helpers, formatting, distance, ZIP lookup, and travel estimator"
```

---

### Task 3: Filter registry, filter application, sorting

**Files:**
- Create: `src/lib/filters/types.ts`, `src/lib/filters/definitions.ts`, `src/lib/filters/definitions.test.ts`, `src/lib/filters/apply.ts`, `src/lib/filters/apply.test.ts`, `src/lib/sort.ts`, `src/lib/sort.test.ts`

**Interfaces:**
- Consumes: `sizeClass`, `SIZE_LABELS`, `STATE_NAMES` from `@/lib/resort`; config constants; `makeResort`.
- Produces:
  - Types in `@/lib/filters/types`: `FilterContext`, `RangeFilterDef`, `MultiFilterDef`, `ToggleFilterDef`, `FilterDefinition`, `FilterValue`, `FilterState`, `EMPTY_TRAVEL`
  - `buildFilters(resorts: SkiResort[], passes: Pass[]): FilterDefinition[]`
  - `isFilterActive(def: FilterDefinition, value: FilterValue | undefined): boolean`
  - `matchesFilter(resort: SkiResort, def: FilterDefinition, value: FilterValue | undefined, ctx: FilterContext): boolean`
  - `applyFilters(resorts: SkiResort[], defs: FilterDefinition[], state: FilterState, ctx: FilterContext): SkiResort[]`
  - `activeFilterCount(defs: FilterDefinition[], state: FilterState): number`
  - `type SortKey = 'distance' | 'vertical' | 'trails' | 'name'`; `SORT_LABELS: Record<SortKey, string>`; `sortResorts(resorts: SkiResort[], key: SortKey, travel: ReadonlyMap<string, TravelEstimate>): SkiResort[]`

- [ ] **Step 1: Write filter types**

Create `src/lib/filters/types.ts`:

```ts
import type { PassId, SkiResort, TravelEstimate } from '@/lib/types';

/** Derived data that predicates may need. */
export type FilterContext = {
  /** Empty when the user has not set a location. */
  travel: ReadonlyMap<string, TravelEstimate>;
  /** Current-season pass ids per resort. */
  passesByResort: ReadonlyMap<string, PassId[]>;
};

export const EMPTY_TRAVEL: ReadonlyMap<string, TravelEstimate> = new Map();

type BaseDef = { id: string; label: string; description?: string };

export type RangeFilterDef = BaseDef & {
  control: 'range';
  unit: string;
  min: number;
  max: number;
  step: number;
  /** 'max' renders a single "up to" thumb (e.g. max distance). */
  mode: 'between' | 'max';
  /** Ignored entirely when the context has no travel data. */
  requiresLocation?: boolean;
  getValue(resort: SkiResort, ctx: FilterContext): number | undefined;
};

export type MultiFilterDef = BaseDef & {
  control: 'multi';
  options: { value: string; label: string }[];
  /** A resort matches if any of its values is selected. */
  getValues(resort: SkiResort, ctx: FilterContext): string[];
};

export type ToggleFilterDef = BaseDef & {
  control: 'toggle';
  test(resort: SkiResort, ctx: FilterContext): boolean;
};

export type FilterDefinition = RangeFilterDef | MultiFilterDef | ToggleFilterDef;

/** range → [lo, hi]; multi → selected values; toggle → on/off. */
export type FilterValue = [number, number] | string[] | boolean;

export type FilterState = Record<string, FilterValue | undefined>;
```

- [ ] **Step 2: Write failing tests for `applyFilters` and friends**

Create `src/lib/filters/apply.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { activeFilterCount, applyFilters, isFilterActive, matchesFilter } from '@/lib/filters/apply';
import { EMPTY_TRAVEL, type FilterContext, type FilterDefinition, type RangeFilterDef } from '@/lib/filters/types';
import { makeResort } from '@/lib/test-fixtures';

const ctx: FilterContext = { travel: EMPTY_TRAVEL, passesByResort: new Map() };

const acres: RangeFilterDef = {
  id: 'acres',
  label: 'Skiable acres',
  control: 'range',
  unit: 'acres',
  min: 0,
  max: 1600,
  step: 50,
  mode: 'between',
  getValue: (r) => r.stats.skiableAcres,
};

const distance: RangeFilterDef = {
  id: 'distance',
  label: 'Max distance',
  control: 'range',
  unit: 'mi',
  min: 0,
  max: 300,
  step: 10,
  mode: 'max',
  requiresLocation: true,
  getValue: (r, c) => c.travel.get(r.id)?.miles,
};

const state: FilterDefinition = {
  id: 'state',
  label: 'State',
  control: 'multi',
  options: [
    { value: 'VT', label: 'Vermont' },
    { value: 'ME', label: 'Maine' },
  ],
  getValues: (r) => [r.location.state],
};

const night: FilterDefinition = {
  id: 'night',
  label: 'Night skiing',
  control: 'toggle',
  test: (r) => r.features.nightSkiing === true,
};

const big = makeResort({ id: 'big', stats: { skiableAcres: 1500 }, features: { nightSkiing: false } });
const small = makeResort({ id: 'small', stats: { skiableAcres: 100 }, features: { nightSkiing: true } });
const unknown = makeResort({ id: 'unknown', stats: {}, location: { state: 'ME', lat: 44.5, lng: -70.5 } });

describe('isFilterActive', () => {
  it('range is active only when narrowed from full extent', () => {
    expect(isFilterActive(acres, undefined)).toBe(false);
    expect(isFilterActive(acres, [0, 1600])).toBe(false);
    expect(isFilterActive(acres, [100, 1600])).toBe(true);
    expect(isFilterActive(acres, [0, 1000])).toBe(true);
  });

  it('multi is active with a selection; toggle when true', () => {
    expect(isFilterActive(state, [])).toBe(false);
    expect(isFilterActive(state, ['VT'])).toBe(true);
    expect(isFilterActive(night, false)).toBe(false);
    expect(isFilterActive(night, true)).toBe(true);
  });
});

describe('matchesFilter', () => {
  it('range filter at full extent keeps resorts missing the stat', () => {
    expect(matchesFilter(unknown, acres, [0, 1600], ctx)).toBe(true);
    expect(matchesFilter(unknown, acres, undefined, ctx)).toBe(true);
  });

  it('narrowed range excludes resorts missing the stat', () => {
    expect(matchesFilter(unknown, acres, [200, 1600], ctx)).toBe(false);
  });

  it('range bound at the slider max means "and above"', () => {
    const huge = makeResort({ stats: { skiableAcres: 5000 } });
    expect(matchesFilter(huge, acres, [1000, 1600], ctx)).toBe(true);
    expect(matchesFilter(huge, acres, [1000, 1500], ctx)).toBe(false);
  });

  it('range checks both bounds inclusively', () => {
    expect(matchesFilter(big, acres, [100, 1500], ctx)).toBe(true);
    expect(matchesFilter(small, acres, [150, 1600], ctx)).toBe(false);
  });

  it('distance filter is ignored when there is no location', () => {
    expect(matchesFilter(big, distance, [0, 50], ctx)).toBe(true);
  });

  it('distance filter applies when travel data exists', () => {
    const withTravel: FilterContext = {
      ...ctx,
      travel: new Map([
        ['big', { resortId: 'big', miles: 40, method: 'straight-line' }],
        ['small', { resortId: 'small', miles: 120, method: 'straight-line' }],
      ]),
    };
    expect(matchesFilter(big, distance, [0, 50], withTravel)).toBe(true);
    expect(matchesFilter(small, distance, [0, 50], withTravel)).toBe(false);
  });

  it('multi matches any selected value', () => {
    expect(matchesFilter(big, state, ['VT', 'ME'], ctx)).toBe(true);
    expect(matchesFilter(unknown, state, ['VT'], ctx)).toBe(false);
  });

  it('toggle filters by predicate only when on', () => {
    expect(matchesFilter(big, night, true, ctx)).toBe(false);
    expect(matchesFilter(big, night, false, ctx)).toBe(true);
  });
});

describe('applyFilters', () => {
  it('ANDs all active filters', () => {
    const result = applyFilters([big, small, unknown], [acres, night, state], { acres: [50, 1600], night: true }, ctx);
    expect(result.map((r) => r.id)).toEqual(['small']);
  });

  it('returns everything with no active filters', () => {
    expect(applyFilters([big, small, unknown], [acres, night, state], {}, ctx)).toHaveLength(3);
  });
});

describe('activeFilterCount', () => {
  it('counts only active filters', () => {
    expect(activeFilterCount([acres, night, state], { acres: [0, 1600], night: true, state: ['VT'] })).toBe(2);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- src/lib/filters`
Expected: FAIL — cannot resolve `@/lib/filters/apply`.

- [ ] **Step 4: Implement `apply.ts`**

Create `src/lib/filters/apply.ts`:

```ts
import type { FilterContext, FilterDefinition, FilterState, FilterValue } from '@/lib/filters/types';
import type { SkiResort } from '@/lib/types';

const isRange = (v: FilterValue | undefined): v is [number, number] =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === 'number';

export function isFilterActive(def: FilterDefinition, value: FilterValue | undefined): boolean {
  switch (def.control) {
    case 'range':
      return isRange(value) && (value[0] > def.min || value[1] < def.max);
    case 'multi':
      return Array.isArray(value) && value.length > 0;
    case 'toggle':
      return value === true;
  }
}

export function matchesFilter(
  resort: SkiResort,
  def: FilterDefinition,
  value: FilterValue | undefined,
  ctx: FilterContext,
): boolean {
  if (!isFilterActive(def, value)) return true;

  switch (def.control) {
    case 'range': {
      if (def.requiresLocation && ctx.travel.size === 0) return true;
      const [lo, hi] = value as [number, number];
      const x = def.getValue(resort, ctx);
      if (x === undefined) return false;
      // A bound sitting at the slider's extent is open-ended.
      if (lo > def.min && x < lo) return false;
      if (hi < def.max && x > hi) return false;
      return true;
    }
    case 'multi': {
      const selected = value as string[];
      return def.getValues(resort, ctx).some((v) => selected.includes(v));
    }
    case 'toggle':
      return def.test(resort, ctx);
  }
}

export function applyFilters(
  resorts: SkiResort[],
  defs: FilterDefinition[],
  state: FilterState,
  ctx: FilterContext,
): SkiResort[] {
  return resorts.filter((r) => defs.every((def) => matchesFilter(r, def, state[def.id], ctx)));
}

export function activeFilterCount(defs: FilterDefinition[], state: FilterState): number {
  return defs.filter((def) => isFilterActive(def, state[def.id])).length;
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- src/lib/filters`
Expected: PASS.

- [ ] **Step 6: Write failing tests for `buildFilters`**

Create `src/lib/filters/definitions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { applyFilters } from '@/lib/filters/apply';
import { buildFilters } from '@/lib/filters/definitions';
import { EMPTY_TRAVEL, type FilterContext, type MultiFilterDef, type RangeFilterDef } from '@/lib/filters/types';
import { makeResort } from '@/lib/test-fixtures';
import type { Pass } from '@/lib/types';

const passes: Pass[] = [
  { id: 'epic', name: 'Epic Pass', website: 'https://www.epicpass.com' },
  { id: 'ikon', name: 'Ikon Pass', website: 'https://www.ikonpass.com' },
];

const vt = makeResort({
  id: 'vt',
  location: { state: 'VT', lat: 44, lng: -72.8 },
  stats: { verticalFt: 3050, trailCount: 155, skiableAcres: 1509 },
  terrain: { basis: 'trails', beginner: 17, intermediate: 40, advanced: 43 },
  features: { nightSkiing: false },
});
const ma = makeResort({
  id: 'ma',
  location: { state: 'MA', lat: 42.5, lng: -71.9 },
  stats: { verticalFt: 1000, trailCount: 27, skiableAcres: 110 },
  terrain: { basis: 'trails', beginner: 30, intermediate: 60, advanced: 10 },
  features: { nightSkiing: true },
});

const defs = buildFilters([vt, ma], passes);
const byId = <T>(id: string) => defs.find((d) => d.id === id) as T;
const ctx: FilterContext = { travel: EMPTY_TRAVEL, passesByResort: new Map([['vt', ['ikon']]]) };
const ids = (state: Record<string, unknown>) => applyFilters([vt, ma], defs, state as never, ctx).map((r) => r.id);

describe('buildFilters', () => {
  it('declares the MVP filters in display order', () => {
    expect(defs.map((d) => d.id)).toEqual([
      'state',
      'pass',
      'size',
      'distance',
      'vertical',
      'trails',
      'acres',
      'nightSkiing',
      'beginnerTerrain',
      'expertTerrain',
    ]);
  });

  it('only offers states that have resorts', () => {
    expect(byId<MultiFilterDef>('state').options.map((o) => o.value)).toEqual(['VT', 'MA']);
  });

  it('offers every registered pass', () => {
    expect(byId<MultiFilterDef>('pass').options).toEqual([
      { value: 'epic', label: 'Epic Pass' },
      { value: 'ikon', label: 'Ikon Pass' },
    ]);
  });

  it('derives range maxima from data, rounded up to the step', () => {
    expect(byId<RangeFilterDef>('vertical').max).toBe(3100);
    expect(byId<RangeFilterDef>('trails').max).toBe(155);
    expect(byId<RangeFilterDef>('acres').max).toBe(1550);
    expect(byId<RangeFilterDef>('distance')).toMatchObject({ max: 300, mode: 'max', requiresLocation: true });
  });

  it('filters by state, pass, size, and toggles', () => {
    expect(ids({ state: ['MA'] })).toEqual(['ma']);
    expect(ids({ pass: ['ikon'] })).toEqual(['vt']);
    expect(ids({ size: ['large'] })).toEqual(['vt']);
    expect(ids({ nightSkiing: true })).toEqual(['ma']);
    expect(ids({ beginnerTerrain: true })).toEqual(['ma']);
    expect(ids({ expertTerrain: true })).toEqual(['vt']);
  });
});
```

- [ ] **Step 7: Run to verify it fails**

Run: `npm test -- src/lib/filters/definitions`
Expected: FAIL — cannot resolve `@/lib/filters/definitions`.

- [ ] **Step 8: Implement `definitions.ts`**

Create `src/lib/filters/definitions.ts`:

```ts
import { BEGINNER_TERRAIN_MIN_PCT, EXPERT_TERRAIN_MIN_PCT } from '@/lib/config';
import type { FilterDefinition, RangeFilterDef } from '@/lib/filters/types';
import { SIZE_LABELS, STATE_NAMES, sizeClass, type SizeClass } from '@/lib/resort';
import type { Pass, SkiResort, StateCode } from '@/lib/types';

const STATE_ORDER: StateCode[] = ['VT', 'NH', 'ME', 'MA', 'CT', 'RI'];
const SIZE_ORDER: SizeClass[] = ['small', 'medium', 'large'];

const MAX_DISTANCE_MI = 300;

function dataMax(resorts: SkiResort[], get: (r: SkiResort) => number | undefined, step: number): number {
  const values = resorts.map(get).filter((v): v is number => v !== undefined);
  const max = values.length ? Math.max(...values) : step;
  return Math.ceil(max / step) * step;
}

function statRange(
  resorts: SkiResort[],
  id: string,
  label: string,
  unit: string,
  step: number,
  get: (r: SkiResort) => number | undefined,
): RangeFilterDef {
  return { id, label, control: 'range', unit, min: 0, max: dataMax(resorts, get, step), step, mode: 'between', getValue: get };
}

/**
 * The filter registry. To add a filter, add one entry here; the panel and
 * applyFilters() pick it up automatically.
 */
export function buildFilters(resorts: SkiResort[], passes: Pass[]): FilterDefinition[] {
  const presentStates = new Set(resorts.map((r) => r.location.state));

  return [
    {
      id: 'state',
      label: 'State',
      control: 'multi',
      options: STATE_ORDER.filter((s) => presentStates.has(s)).map((s) => ({ value: s, label: STATE_NAMES[s] })),
      getValues: (r) => [r.location.state],
    },
    {
      id: 'pass',
      label: 'Pass',
      control: 'multi',
      options: passes.map((p) => ({ value: p.id, label: p.name })),
      getValues: (r, ctx) => ctx.passesByResort.get(r.id) ?? [],
    },
    {
      id: 'size',
      label: 'Mountain size',
      description: 'By vertical drop',
      control: 'multi',
      options: SIZE_ORDER.map((s) => ({ value: s, label: SIZE_LABELS[s] })),
      getValues: (r) => {
        const size = sizeClass(r);
        return size ? [size] : [];
      },
    },
    {
      id: 'distance',
      label: 'Max distance',
      description: 'Straight-line from your location',
      control: 'range',
      unit: 'mi',
      min: 0,
      max: MAX_DISTANCE_MI,
      step: 10,
      mode: 'max',
      requiresLocation: true,
      getValue: (r, ctx) => ctx.travel.get(r.id)?.miles,
    },
    statRange(resorts, 'vertical', 'Vertical drop', 'ft', 100, (r) => r.stats.verticalFt),
    statRange(resorts, 'trails', 'Trail count', 'trails', 5, (r) => r.stats.trailCount),
    statRange(resorts, 'acres', 'Skiable acres', 'acres', 50, (r) => r.stats.skiableAcres),
    {
      id: 'nightSkiing',
      label: 'Night skiing',
      control: 'toggle',
      test: (r) => r.features.nightSkiing === true,
    },
    {
      id: 'beginnerTerrain',
      label: 'Beginner terrain',
      description: `At least ${BEGINNER_TERRAIN_MIN_PCT}% beginner (green) terrain`,
      control: 'toggle',
      test: (r) => (r.terrain?.beginner ?? 0) >= BEGINNER_TERRAIN_MIN_PCT,
    },
    {
      id: 'expertTerrain',
      label: 'Advanced/expert terrain',
      description: `At least ${EXPERT_TERRAIN_MIN_PCT}% black or double-black terrain`,
      control: 'toggle',
      test: (r) => (r.terrain?.advanced ?? 0) + (r.terrain?.expert ?? 0) >= EXPERT_TERRAIN_MIN_PCT,
    },
  ];
}
```

- [ ] **Step 9: Run to verify it passes**

Run: `npm test -- src/lib/filters`
Expected: PASS.

- [ ] **Step 10: Write failing sort tests**

Create `src/lib/sort.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { EMPTY_TRAVEL } from '@/lib/filters/types';
import { sortResorts } from '@/lib/sort';
import { makeResort } from '@/lib/test-fixtures';
import type { TravelEstimate } from '@/lib/types';

const a = makeResort({ id: 'a', name: 'Alpha', stats: { verticalFt: 1000, trailCount: 50 } });
const b = makeResort({ id: 'b', name: 'Bravo', stats: { verticalFt: 3000 } });
const c = makeResort({ id: 'c', name: 'Charlie', stats: { trailCount: 100 } });
const resorts = [c, b, a];

const travel = new Map<string, TravelEstimate>([
  ['a', { resortId: 'a', miles: 90, method: 'straight-line' }],
  ['b', { resortId: 'b', miles: 30, method: 'straight-line' }],
  ['c', { resortId: 'c', miles: 60, method: 'straight-line' }],
]);

const ids = (list: { id: string }[]) => list.map((r) => r.id);

describe('sortResorts', () => {
  it('sorts by name', () => {
    expect(ids(sortResorts(resorts, 'name', EMPTY_TRAVEL))).toEqual(['a', 'b', 'c']);
  });

  it('sorts by vertical descending, missing last', () => {
    expect(ids(sortResorts(resorts, 'vertical', EMPTY_TRAVEL))).toEqual(['b', 'a', 'c']);
  });

  it('sorts by trails descending, missing last', () => {
    expect(ids(sortResorts(resorts, 'trails', EMPTY_TRAVEL))).toEqual(['c', 'a', 'b']);
  });

  it('sorts by distance ascending', () => {
    expect(ids(sortResorts(resorts, 'distance', travel))).toEqual(['b', 'c', 'a']);
  });

  it('falls back to name when sorting by distance without a location', () => {
    expect(ids(sortResorts(resorts, 'distance', EMPTY_TRAVEL))).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input', () => {
    const input = [c, b, a];
    sortResorts(input, 'name', EMPTY_TRAVEL);
    expect(ids(input)).toEqual(['c', 'b', 'a']);
  });
});
```

- [ ] **Step 11: Run to verify it fails**

Run: `npm test -- src/lib/sort`
Expected: FAIL — cannot resolve `@/lib/sort`.

- [ ] **Step 12: Implement `sort.ts`**

Create `src/lib/sort.ts`:

```ts
import type { SkiResort, TravelEstimate } from '@/lib/types';

export type SortKey = 'distance' | 'vertical' | 'trails' | 'name';

export const SORT_LABELS: Record<SortKey, string> = {
  distance: 'Distance',
  vertical: 'Vertical drop',
  trails: 'Trail count',
  name: 'Name',
};

const byName = (a: SkiResort, b: SkiResort) => a.name.localeCompare(b.name);

/** Missing values sort last; ties broken by name. */
function byNumber(get: (r: SkiResort) => number | undefined, direction: 1 | -1) {
  return (a: SkiResort, b: SkiResort) => {
    const x = get(a);
    const y = get(b);
    if (x === undefined && y === undefined) return byName(a, b);
    if (x === undefined) return 1;
    if (y === undefined) return -1;
    return (x - y) * direction || byName(a, b);
  };
}

export function sortResorts(
  resorts: SkiResort[],
  key: SortKey,
  travel: ReadonlyMap<string, TravelEstimate>,
): SkiResort[] {
  const list = [...resorts];
  switch (key) {
    case 'distance':
      return travel.size === 0 ? list.sort(byName) : list.sort(byNumber((r) => travel.get(r.id)?.miles, 1));
    case 'vertical':
      return list.sort(byNumber((r) => r.stats.verticalFt, -1));
    case 'trails':
      return list.sort(byNumber((r) => r.stats.trailCount, -1));
    case 'name':
      return list.sort(byName);
  }
}
```

- [ ] **Step 13: Run all tests and commit**

Run: `npm test && npx tsc --noEmit`
Expected: all PASS.

```bash
git add -A
git commit -m "Add declarative filter registry, filter application, and sorting"
```

---

### Task 4: Map with clustering, resort details panel, desktop shell

**Files:**
- Create: `src/components/ExplorerLoader.tsx`, `src/components/ResortExplorer.tsx`, `src/components/map/ResortMap.tsx`, `src/components/resorts/ResortDetails.tsx`, `src/components/resorts/TerrainBar.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: data exports (Task 1); `affiliationsFor`, `buildPassIndex`, `sizeClass`, `SIZE_LABELS`, `STATE_NAMES`, `RATING_LABELS`, format helpers (Task 2); `EMPTY_TRAVEL` (Task 3).
- Produces:
  - `ResortMap` default export, props `{ resorts: SkiResort[]; selected: SkiResort | null; onSelect: (id: string) => void; userLocation?: LatLng | null; focusPadding?: { right?: number; bottom?: number } }`
  - `ResortDetails` props `{ resort: SkiResort; affiliations: PassAffiliation[]; passNames: ReadonlyMap<string, string>; ratings: ResortRating[]; travel?: TravelEstimate; onClose: () => void }`
  - `TerrainBar` props `{ terrain: TerrainBreakdown }`

UI tasks have no unit tests (all logic is in tested `lib/` functions); each ends with a manual browser check plus `tsc`, `lint`, and `build`.

- [ ] **Step 1: Client-only loader and page**

MapLibre needs `window`, and the explorer reads `localStorage` on first render (Task 6), so the whole explorer is client-rendered.

Create `src/components/ExplorerLoader.tsx`:

```tsx
'use client';

import dynamic from 'next/dynamic';

const ResortExplorer = dynamic(() => import('@/components/ResortExplorer'), {
  ssr: false,
  loading: () => <div className="grid h-dvh place-items-center text-sm text-muted-foreground">Loading map…</div>,
});

export default function ExplorerLoader() {
  return <ResortExplorer />;
}
```

Replace `src/app/page.tsx`:

```tsx
import ExplorerLoader from '@/components/ExplorerLoader';

export default function Home() {
  return <ExplorerLoader />;
}
```

- [ ] **Step 2: Map component**

Create `src/components/map/ResortMap.tsx`:

```tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import MapGL, { Layer, Marker, Popup, Source, type MapLayerMouseEvent, type MapRef } from 'react-map-gl/maplibre';
import type { GeoJSONSource } from 'maplibre-gl';
import type { FeatureCollection, Point } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE_URL, NEW_ENGLAND_BOUNDS } from '@/lib/config';
import type { LatLng, SkiResort } from '@/lib/types';

type Props = {
  resorts: SkiResort[];
  selected: SkiResort | null;
  onSelect: (id: string) => void;
  userLocation?: LatLng | null;
  /** Space covered by overlays (details panel / bottom sheet) so fly-to centers in the visible area. */
  focusPadding?: { right?: number; bottom?: number };
};

type ResortFeatureProps = { id: string; name: string };
type Hover = { name: string; lng: number; lat: number };

const SOURCE_ID = 'resorts';
const ACCENT = '#1d4ed8';
const SELECTED = '#f97316';

export default function ResortMap({ resorts, selected, onSelect, userLocation, focusPadding }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const data = useMemo<FeatureCollection<Point, ResortFeatureProps>>(
    () => ({
      type: 'FeatureCollection',
      features: resorts.map((r) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.location.lng, r.location.lat] },
        properties: { id: r.id, name: r.name },
      })),
    }),
    [resorts],
  );

  const padRight = focusPadding?.right ?? 0;
  const padBottom = focusPadding?.bottom ?? 0;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;
    map.flyTo({
      center: [selected.location.lng, selected.location.lat],
      zoom: Math.max(map.getZoom(), 9),
      padding: { top: 0, left: 0, right: padRight, bottom: padBottom },
      duration: 800,
    });
  }, [selected, padRight, padBottom]);

  const handleClick = async (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) return;
    const [lng, lat] = (feature.geometry as Point).coordinates;
    if (feature.layer.id === 'clusters') {
      const source = mapRef.current?.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      if (!source) return;
      const zoom = await source.getClusterExpansionZoom(feature.properties.cluster_id as number);
      mapRef.current?.easeTo({ center: [lng, lat], zoom });
      return;
    }
    onSelect(feature.properties.id as string);
  };

  const handleMouseMove = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature || feature.layer.id !== 'points') {
      setHover(null);
      return;
    }
    const [lng, lat] = (feature.geometry as Point).coordinates;
    const name = feature.properties.name as string;
    setHover((h) => (h?.name === name ? h : { name, lng, lat }));
  };

  return (
    <div className="relative h-full w-full">
      <MapGL
        ref={mapRef}
        initialViewState={{
          bounds: [
            [NEW_ENGLAND_BOUNDS.west, NEW_ENGLAND_BOUNDS.south],
            [NEW_ENGLAND_BOUNDS.east, NEW_ENGLAND_BOUNDS.north],
          ],
          fitBoundsOptions: { padding: 24 },
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE_URL}
        interactiveLayerIds={['clusters', 'points']}
        cursor={hover ? 'pointer' : undefined}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!loaded) setFailed(true);
        }}
      >
        <Source id={SOURCE_ID} type="geojson" data={data} cluster clusterMaxZoom={8} clusterRadius={40}>
          <Layer
            id="clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': ACCENT,
              'circle-opacity': 0.85,
              'circle-radius': ['step', ['get', 'point_count'], 16, 5, 20, 15, 26],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{ 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 13 }}
            paint={{ 'text-color': '#ffffff' }}
          />
          <Layer
            id="points"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{ 'circle-color': ACCENT, 'circle-radius': 7, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' }}
          />
          <Layer
            id="selected-point"
            type="circle"
            filter={['==', ['get', 'id'], selected?.id ?? '']}
            paint={{ 'circle-color': SELECTED, 'circle-radius': 10, 'circle-stroke-width': 3, 'circle-stroke-color': '#ffffff' }}
          />
          <Layer
            id="point-labels"
            type="symbol"
            minzoom={9}
            filter={['!', ['has', 'point_count']]}
            layout={{
              'text-field': ['get', 'name'],
              'text-font': ['Noto Sans Regular'],
              'text-size': 12,
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
            }}
            paint={{ 'text-color': '#0f172a', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 }}
          />
        </Source>

        {hover && (
          <Popup longitude={hover.lng} latitude={hover.lat} closeButton={false} closeOnClick={false} anchor="bottom" offset={12}>
            <span className="text-sm font-medium">{hover.name}</span>
          </Popup>
        )}

        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
            <div aria-label="Your location" className="size-4 rounded-full border-2 border-white bg-sky-500 shadow-md" />
          </Marker>
        )}
      </MapGL>

      {failed && (
        <div className="absolute inset-x-3 top-3 rounded-md bg-background/95 p-3 text-sm shadow">
          The map couldn&apos;t load. The resort list and filters still work.
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Terrain bar and details panel**

Create `src/components/resorts/TerrainBar.tsx`:

```tsx
import type { TerrainBreakdown } from '@/lib/types';

const SEGMENTS = [
  { key: 'beginner', label: 'Beginner', className: 'bg-green-600' },
  { key: 'intermediate', label: 'Intermediate', className: 'bg-blue-600' },
  { key: 'advanced', label: 'Advanced', className: 'bg-neutral-800' },
  { key: 'expert', label: 'Expert', className: 'bg-neutral-950 ring-1 ring-inset ring-amber-400' },
] as const;

export function TerrainBar({ terrain }: { terrain: TerrainBreakdown }) {
  const segments = SEGMENTS.filter((s) => terrain[s.key] !== undefined);
  if (segments.length === 0) return null;

  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {segments.map((s) => (
          <div key={s.key} className={s.className} style={{ width: `${terrain[s.key]}%` }} />
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${s.className}`} />
            {s.label} {terrain[s.key]}%
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-muted-foreground">
        % of {terrain.basis === 'trails' ? 'trails' : 'skiable acreage'}
        {terrain.expert === undefined && terrain.advanced !== undefined ? ' · advanced includes all black terrain' : ''}
      </p>
    </div>
  );
}
```

Create `src/components/resorts/ResortDetails.tsx`:

```tsx
import { ExternalLink, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TerrainBar } from '@/components/resorts/TerrainBar';
import { formatCoords, formatMiles, passAccessLabel, withUnit, yesNo } from '@/lib/format';
import { RATING_LABELS, SIZE_LABELS, STATE_NAMES, sizeClass } from '@/lib/resort';
import type { PassAffiliation, ResortRating, SkiResort, TravelEstimate } from '@/lib/types';

type Props = {
  resort: SkiResort;
  affiliations: PassAffiliation[];
  passNames: ReadonlyMap<string, string>;
  ratings: ResortRating[];
  travel?: TravelEstimate;
  onClose: () => void;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t py-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

const TRAIL_MAP_KIND_LABEL = { page: '', pdf: ' (PDF)', image: ' (image)' } as const;

export function ResortDetails({ resort, affiliations, passNames, ratings, travel, onClose }: Props) {
  const { stats, features, location } = resort;
  const size = sizeClass(resort);

  return (
    <article className="text-sm">
      <header className="flex items-start justify-between gap-2 pb-3">
        <div>
          <h2 className="text-lg font-semibold leading-tight">{resort.name}</h2>
          {resort.formerNames?.length ? (
            <p className="text-xs text-muted-foreground">Formerly {resort.formerNames.join(', ')}</p>
          ) : null}
          <p className="text-muted-foreground">
            {[location.town, STATE_NAMES[location.state]].filter(Boolean).join(', ')}
          </p>
          {travel && (
            <p className="mt-1 font-medium">
              {formatMiles(travel.miles)} <span className="font-normal text-muted-foreground">(straight-line)</span>
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details">
          <X />
        </Button>
      </header>

      {resort.description && <p className="pb-4">{resort.description}</p>}

      <Section title="Mountain">
        <dl className="grid grid-cols-2 gap-3">
          <Stat label="Vertical drop" value={withUnit(stats.verticalFt, 'ft')} />
          <Stat label="Size" value={size ? SIZE_LABELS[size] : '—'} />
          <Stat label="Trails" value={withUnit(stats.trailCount, '')} />
          <Stat label="Skiable acres" value={withUnit(stats.skiableAcres, '')} />
          <Stat label="Summit elevation" value={withUnit(stats.summitElevationFt, 'ft')} />
          <Stat label="Base elevation" value={withUnit(stats.baseElevationFt, 'ft')} />
          <Stat label="Lifts" value={withUnit(stats.liftCount, '')} />
          <Stat label="Coordinates" value={formatCoords(location)} />
        </dl>
      </Section>

      {resort.terrain && (
        <Section title="Terrain">
          <TerrainBar terrain={resort.terrain} />
        </Section>
      )}

      <Section title="Features">
        <dl className="grid grid-cols-2 gap-3">
          <Stat label="Night skiing" value={yesNo(features.nightSkiing)} />
          <Stat label="Terrain park" value={yesNo(features.terrainPark)} />
          <Stat
            label="Snowmaking"
            value={features.snowmakingPercent === undefined ? '—' : `${features.snowmakingPercent}%`}
          />
        </dl>
      </Section>

      <Section title={`Passes (${affiliations[0]?.season ?? 'current season'})`}>
        {affiliations.length === 0 ? (
          <p className="text-muted-foreground">Not on any tracked pass.</p>
        ) : (
          <ul className="space-y-1.5">
            {affiliations.map((a) => (
              <li key={a.passId} className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{passNames.get(a.passId) ?? a.passId}</Badge>
                <span>{passAccessLabel(a)}</span>
                {a.notes && <span className="text-muted-foreground">· {a.notes}</span>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Links">
        <ul className="space-y-1.5">
          {resort.links.website && (
            <li>
              <a className="inline-flex items-center gap-1 text-blue-700 hover:underline" href={resort.links.website} target="_blank" rel="noopener noreferrer">
                Official website <ExternalLink className="size-3.5" />
              </a>
            </li>
          )}
          {resort.links.trailMaps?.map((m) => (
            <li key={m.url}>
              <a className="inline-flex items-center gap-1 text-blue-700 hover:underline" href={m.url} target="_blank" rel="noopener noreferrer">
                Official trail map{TRAIL_MAP_KIND_LABEL[m.kind]} <ExternalLink className="size-3.5" />
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Community ratings">
        {ratings.length === 0 ? (
          <p className="text-muted-foreground">
            No community ratings yet. Subjective ratings will only appear here alongside their sources.
          </p>
        ) : (
          <ul className="space-y-2">
            {ratings.map((r) => (
              <li key={r.attribute}>
                <span className="font-medium">{RATING_LABELS[r.attribute]}:</span> {r.value}/5{' '}
                <span className="text-muted-foreground">
                  ({r.method}, as of {r.asOf}) ·{' '}
                  {r.sources.map((s, i) => (
                    <a key={s.url} className="text-blue-700 hover:underline" href={s.url} target="_blank" rel="noopener noreferrer">
                      {i > 0 ? ', ' : ''}
                      {s.label}
                    </a>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <footer className="border-t pt-3 text-xs text-muted-foreground">
        Data last verified {resort.meta.lastVerified}. Sources:{' '}
        {resort.meta.sources.map((s, i) => (
          <a key={s.url} className="hover:underline" href={s.url} target="_blank" rel="noopener noreferrer">
            {i > 0 ? ', ' : ''}
            {s.label}
          </a>
        ))}
      </footer>
    </article>
  );
}
```

Note: `withUnit(n, '')` yields a trailing space (`'155 '`); change `withUnit` in `src/lib/format.ts` to trim:

```ts
export function withUnit(n: number | undefined, unit: string): string {
  return n === undefined ? '—' : `${formatNumber(n)} ${unit}`.trim();
}
```

and add to `src/lib/format.test.ts` inside the first `it`:

```ts
    expect(withUnit(155, '')).toBe('155');
```

Run: `npm test -- src/lib/format`
Expected: PASS.

- [ ] **Step 4: Explorer (map + details, desktop layout)**

Create `src/components/ResortExplorer.tsx`:

```tsx
'use client';

import { useState } from 'react';
import ResortMap from '@/components/map/ResortMap';
import { ResortDetails } from '@/components/resorts/ResortDetails';
import { PASS_AFFILIATIONS } from '@/data/pass-affiliations';
import { PASSES } from '@/data/passes';
import { RATINGS } from '@/data/ratings';
import { RESORTS } from '@/data/resorts';
import { CURRENT_SEASON } from '@/lib/config';
import { affiliationsFor } from '@/lib/resort';

const PASS_NAMES: ReadonlyMap<string, string> = new Map(PASSES.map((p) => [p.id, p.name]));
const DETAILS_WIDTH = 400;

export default function ResortExplorer() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = RESORTS.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="grid h-dvh grid-cols-[360px_1fr]">
      <aside className="overflow-y-auto border-r p-4">
        <h1 className="text-lg font-semibold">New England Ski Resorts</h1>
        <p className="text-sm text-muted-foreground">{RESORTS.length} resorts</p>
      </aside>

      <main className="relative">
        <ResortMap
          resorts={RESORTS}
          selected={selected}
          onSelect={setSelectedId}
          focusPadding={{ right: selected ? DETAILS_WIDTH : 0 }}
        />
        {selected && (
          <div
            className="absolute inset-y-3 right-3 overflow-y-auto rounded-lg bg-background p-4 shadow-lg"
            style={{ width: DETAILS_WIDTH - 24 }}
          >
            <ResortDetails
              resort={selected}
              affiliations={affiliationsFor(selected.id, PASS_AFFILIATIONS, CURRENT_SEASON)}
              passNames={PASS_NAMES}
              ratings={RATINGS.filter((r) => r.resortId === selected.id)}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck, lint, build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: no errors; build succeeds.

- [ ] **Step 6: Manual check**

Run: `npm run dev` and open http://localhost:3000 at desktop width.
Expected:
- Map shows New England; seed resorts appear as blue dots (clustered into a numbered bubble at low zoom if close together).
- Clicking a cluster zooms in; hovering a dot shows its name; at zoom ≥ 9 names appear as labels.
- Clicking a dot turns it orange, flies to it, and opens the details panel on the right with stats, passes, links, "No community ratings yet", and "Data last verified".
- The close (X) button closes the panel.
- If the cluster counts render as empty squares, change `'Noto Sans Bold'` to `'Noto Sans Regular'`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add clustered resort map and resort details panel"
```

---

### Task 5: Filter panel and resort list, synced with the map

**Files:**
- Create: `src/hooks/useResortFilters.ts`, `src/components/filters/FilterPanel.tsx`, `src/components/resorts/ResortCard.tsx`, `src/components/resorts/ResortList.tsx`
- Modify: `src/components/ResortExplorer.tsx` (full replacement)

**Interfaces:**
- Consumes: `buildFilters`, `applyFilters`, `activeFilterCount`, `isFilterActive`, filter types, `EMPTY_TRAVEL` (Task 3); `sortResorts`, `SORT_LABELS`, `SortKey` (Task 3); `buildPassIndex` (Task 2).
- Produces:
  - `useResortFilters(defs: FilterDefinition[]): { state: FilterState; setValue: (id: string, value: FilterValue | undefined) => void; clear: () => void; activeCount: number }`
  - `FilterPanel` props `{ defs: FilterDefinition[]; state: FilterState; onChange: (id: string, value: FilterValue | undefined) => void; onClear: () => void; activeCount: number; hasLocation: boolean }`
  - `ResortList` props `{ resorts: SkiResort[]; selectedId: string | null; onSelect: (id: string) => void; travel: ReadonlyMap<string, TravelEstimate>; passIndex: ReadonlyMap<string, PassId[]>; passNames: ReadonlyMap<string, string>; sortKey: SortKey; onSortChange: (key: SortKey) => void; onClearFilters: () => void }`

- [ ] **Step 1: Filter state hook**

Create `src/hooks/useResortFilters.ts`:

```ts
import { useCallback, useMemo, useState } from 'react';
import { activeFilterCount } from '@/lib/filters/apply';
import type { FilterDefinition, FilterState, FilterValue } from '@/lib/filters/types';

export function useResortFilters(defs: FilterDefinition[]) {
  const [state, setState] = useState<FilterState>({});

  const setValue = useCallback((id: string, value: FilterValue | undefined) => {
    setState((s) => ({ ...s, [id]: value }));
  }, []);

  const clear = useCallback(() => setState({}), []);

  const activeCount = useMemo(() => activeFilterCount(defs, state), [defs, state]);

  return { state, setValue, clear, activeCount };
}
```

- [ ] **Step 2: Filter panel**

Create `src/components/filters/FilterPanel.tsx`:

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { isFilterActive } from '@/lib/filters/apply';
import type {
  FilterDefinition,
  FilterState,
  FilterValue,
  MultiFilterDef,
  RangeFilterDef,
  ToggleFilterDef,
} from '@/lib/filters/types';
import { formatNumber } from '@/lib/format';

type Props = {
  defs: FilterDefinition[];
  state: FilterState;
  onChange: (id: string, value: FilterValue | undefined) => void;
  onClear: () => void;
  activeCount: number;
  hasLocation: boolean;
};

function rangeSummary(def: RangeFilterDef, value: FilterValue | undefined): string {
  if (!isFilterActive(def, value)) return 'Any';
  const [lo, hi] = value as [number, number];
  const hiText = hi >= def.max ? `${formatNumber(def.max)}+` : formatNumber(hi);
  if (def.mode === 'max') return `Up to ${hiText} ${def.unit}`;
  return `${formatNumber(lo)}–${hiText} ${def.unit}`;
}

function RangeControl({ def, value, onChange, disabled }: {
  def: RangeFilterDef;
  value: FilterValue | undefined;
  onChange: (v: [number, number]) => void;
  disabled: boolean;
}) {
  const [lo, hi] = (Array.isArray(value) && typeof value[0] === 'number' ? value : [def.min, def.max]) as [number, number];
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{def.label}</span>
        <span className="text-xs text-muted-foreground">{rangeSummary(def, value)}</span>
      </div>
      <Slider
        min={def.min}
        max={def.max}
        step={def.step}
        disabled={disabled}
        value={def.mode === 'max' ? [hi] : [lo, hi]}
        onValueChange={(v) => onChange(def.mode === 'max' ? [def.min, v[0]] : [v[0], v[1]])}
        aria-label={def.label}
      />
      {disabled ? (
        <p className="mt-1 text-xs text-muted-foreground">Set your location to filter by distance.</p>
      ) : (
        def.description && <p className="mt-1 text-xs text-muted-foreground">{def.description}</p>
      )}
    </div>
  );
}

function MultiControl({ def, value, onChange }: {
  def: MultiFilterDef;
  value: FilterValue | undefined;
  onChange: (v: string[]) => void;
}) {
  const selected = Array.isArray(value) && typeof value[0] !== 'number' ? (value as string[]) : [];
  const toggle = (option: string) =>
    onChange(selected.includes(option) ? selected.filter((v) => v !== option) : [...selected, option]);

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{def.label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {def.options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o.value)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                on ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {def.description && <p className="mt-1 text-xs text-muted-foreground">{def.description}</p>}
    </fieldset>
  );
}

function ToggleControl({ def, value, onChange }: {
  def: ToggleFilterDef;
  value: FilterValue | undefined;
  onChange: (v: boolean) => void;
}) {
  const id = `filter-${def.id}`;
  return (
    <div className="flex items-start gap-2">
      <Checkbox id={id} checked={value === true} onCheckedChange={(c) => onChange(c === true)} className="mt-0.5" />
      <label htmlFor={id} className="text-sm">
        <span className="font-medium">{def.label}</span>
        {def.description && <span className="block text-xs text-muted-foreground">{def.description}</span>}
      </label>
    </div>
  );
}

export function FilterPanel({ defs, state, onChange, onClear, activeCount, hasLocation }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters{activeCount > 0 ? ` (${activeCount})` : ''}</h2>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={activeCount === 0}>
          Clear all
        </Button>
      </div>
      {defs.map((def) => {
        const value = state[def.id];
        switch (def.control) {
          case 'range':
            return (
              <RangeControl
                key={def.id}
                def={def}
                value={value}
                onChange={(v) => onChange(def.id, v)}
                disabled={def.requiresLocation === true && !hasLocation}
              />
            );
          case 'multi':
            return <MultiControl key={def.id} def={def} value={value} onChange={(v) => onChange(def.id, v)} />;
          case 'toggle':
            return <ToggleControl key={def.id} def={def} value={value} onChange={(v) => onChange(def.id, v)} />;
        }
      })}
    </div>
  );
}
```

- [ ] **Step 3: Resort card and list**

Create `src/components/resorts/ResortCard.tsx`:

```tsx
import { Badge } from '@/components/ui/badge';
import { formatMiles, withUnit } from '@/lib/format';
import type { PassId, SkiResort, TravelEstimate } from '@/lib/types';

type Props = {
  resort: SkiResort;
  selected: boolean;
  onSelect: (id: string) => void;
  travel?: TravelEstimate;
  passIds: PassId[];
  passNames: ReadonlyMap<string, string>;
};

export function ResortCard({ resort, selected, onSelect, travel, passIds, passNames }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(resort.id)}
      aria-current={selected}
      className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 ${
        selected ? 'border-orange-500 bg-orange-50' : ''
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{resort.name}</span>
        {travel && <span className="shrink-0 text-xs text-muted-foreground">{formatMiles(travel.miles)}</span>}
      </div>
      <div className="text-xs text-muted-foreground">
        {resort.location.state} · {withUnit(resort.stats.verticalFt, 'ft vert')} · {withUnit(resort.stats.trailCount, 'trails')}
      </div>
      {passIds.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {passIds.map((id) => (
            <Badge key={id} variant="secondary" className="text-[10px]">
              {passNames.get(id) ?? id}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );
}
```

Create `src/components/resorts/ResortList.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { ResortCard } from '@/components/resorts/ResortCard';
import { SORT_LABELS, type SortKey } from '@/lib/sort';
import type { PassId, SkiResort, TravelEstimate } from '@/lib/types';

type Props = {
  resorts: SkiResort[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  travel: ReadonlyMap<string, TravelEstimate>;
  passIndex: ReadonlyMap<string, PassId[]>;
  passNames: ReadonlyMap<string, string>;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
  onClearFilters: () => void;
};

const SORT_KEYS = Object.keys(SORT_LABELS) as SortKey[];

export function ResortList({
  resorts,
  selectedId,
  onSelect,
  travel,
  passIndex,
  passNames,
  sortKey,
  onSortChange,
  onClearFilters,
}: Props) {
  const hasLocation = travel.size > 0;
  const effectiveSort = sortKey === 'distance' && !hasLocation ? 'name' : sortKey;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {resorts.length} {resorts.length === 1 ? 'resort' : 'resorts'}
        </h2>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Sort
          <select
            value={effectiveSort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="rounded-md border bg-background px-2 py-1 text-xs text-foreground"
          >
            {SORT_KEYS.map((key) => (
              <option key={key} value={key} disabled={key === 'distance' && !hasLocation}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {resorts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          <p>No resorts match these filters.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onClearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {resorts.map((r) => (
            <li key={r.id}>
              <ResortCard
                resort={r}
                selected={r.id === selectedId}
                onSelect={onSelect}
                travel={travel.get(r.id)}
                passIds={passIndex.get(r.id) ?? []}
                passNames={passNames}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Wire it together**

Replace `src/components/ResortExplorer.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';
import { FilterPanel } from '@/components/filters/FilterPanel';
import ResortMap from '@/components/map/ResortMap';
import { ResortDetails } from '@/components/resorts/ResortDetails';
import { ResortList } from '@/components/resorts/ResortList';
import { PASS_AFFILIATIONS } from '@/data/pass-affiliations';
import { PASSES } from '@/data/passes';
import { RATINGS } from '@/data/ratings';
import { RESORTS } from '@/data/resorts';
import { useResortFilters } from '@/hooks/useResortFilters';
import { CURRENT_SEASON } from '@/lib/config';
import { applyFilters } from '@/lib/filters/apply';
import { buildFilters } from '@/lib/filters/definitions';
import { EMPTY_TRAVEL, type FilterContext } from '@/lib/filters/types';
import { affiliationsFor, buildPassIndex } from '@/lib/resort';
import { sortResorts, type SortKey } from '@/lib/sort';

const PASS_NAMES: ReadonlyMap<string, string> = new Map(PASSES.map((p) => [p.id, p.name]));
const PASS_INDEX = buildPassIndex(PASS_AFFILIATIONS, CURRENT_SEASON);
const FILTER_DEFS = buildFilters(RESORTS, PASSES);
const DETAILS_WIDTH = 400;

export default function ResortExplorer() {
  const filters = useResortFilters(FILTER_DEFS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('distance');

  const travel = EMPTY_TRAVEL;
  const ctx = useMemo<FilterContext>(() => ({ travel, passesByResort: PASS_INDEX }), [travel]);
  const filtered = useMemo(() => applyFilters(RESORTS, FILTER_DEFS, filters.state, ctx), [filters.state, ctx]);
  const sorted = useMemo(() => sortResorts(filtered, sortKey, travel), [filtered, sortKey, travel]);

  // A selection hidden by the filters closes its details.
  const selected = filtered.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="grid h-dvh grid-cols-[360px_1fr]">
      <aside className="space-y-6 overflow-y-auto border-r p-4">
        <h1 className="text-lg font-semibold">New England Ski Resorts</h1>
        <FilterPanel
          defs={FILTER_DEFS}
          state={filters.state}
          onChange={filters.setValue}
          onClear={filters.clear}
          activeCount={filters.activeCount}
          hasLocation={travel.size > 0}
        />
        <ResortList
          resorts={sorted}
          selectedId={selected?.id ?? null}
          onSelect={setSelectedId}
          travel={travel}
          passIndex={PASS_INDEX}
          passNames={PASS_NAMES}
          sortKey={sortKey}
          onSortChange={setSortKey}
          onClearFilters={filters.clear}
        />
      </aside>

      <main className="relative">
        <ResortMap
          resorts={filtered}
          selected={selected}
          onSelect={setSelectedId}
          focusPadding={{ right: selected ? DETAILS_WIDTH : 0 }}
        />
        {selected && (
          <div
            className="absolute inset-y-3 right-3 overflow-y-auto rounded-lg bg-background p-4 shadow-lg"
            style={{ width: DETAILS_WIDTH - 24 }}
          >
            <ResortDetails
              resort={selected}
              affiliations={affiliationsFor(selected.id, PASS_AFFILIATIONS, CURRENT_SEASON)}
              passNames={PASS_NAMES}
              ratings={RATINGS.filter((r) => r.resortId === selected.id)}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck, lint, build**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 6: Manual check**

Run: `npm run dev`, desktop width.
Expected:
- Filters render: State chips (only states with data), Pass chips, Size chips, a disabled "Max distance" slider with "Set your location…" hint, three range sliders showing "Any", and three checkboxes.
- Selecting "Ikon Pass" leaves only Ikon resorts in both the list and on the map; count updates; "Filters (1)" and "Clear all" enabled.
- Narrowing vertical to e.g. 2,000+ hides Wachusett from list and map.
- A filter combination with no matches shows "No resorts match these filters." with a working "Clear filters" button.
- Clicking a list card selects it (orange on map, details open); filtering it out closes the details.
- Sort dropdown: "Distance" disabled; Name / Vertical / Trail count reorder the list.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add filter panel and resort list synced with the map"
```

---

### Task 6: User location — ZIP and geolocation, distances, distance filter

**Files:**
- Create: `src/hooks/useUserLocation.ts`, `src/hooks/useTravelEstimates.ts`, `src/components/location/LocationInput.tsx`
- Modify: `src/components/ResortExplorer.tsx` (full replacement)

**Interfaces:**
- Consumes: `resolveZip`, `loadZipTable` (Task 2); `parseStoredLocation`, `LOCATION_STORAGE_KEY`, `UserLocation` (Task 2); `straightLineEstimator`, `TravelEstimator` (Task 2); `EMPTY_TRAVEL` (Task 3).
- Produces:
  - `useUserLocation(): { location: UserLocation | null; error: string | null; locating: boolean; setFromZip: (input: string) => Promise<void>; locate: () => void; clear: () => void }`
  - `useTravelEstimates(location: UserLocation | null, resorts: SkiResort[], estimator?: TravelEstimator): ReadonlyMap<string, TravelEstimate>`
  - `LocationInput` props `{ location: UserLocation | null; error: string | null; locating: boolean; onZip: (zip: string) => void; onLocate: () => void; onClear: () => void }`

- [ ] **Step 1: Location hook**

Create `src/hooks/useUserLocation.ts`:

```ts
import { useCallback, useState } from 'react';
import { loadZipTable, resolveZip } from '@/lib/geo/geocode';
import { LOCATION_STORAGE_KEY, parseStoredLocation, type UserLocation } from '@/lib/geo/stored-location';

function readStored(): UserLocation | null {
  try {
    return parseStoredLocation(localStorage.getItem(LOCATION_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStored(location: UserLocation | null) {
  try {
    if (location) localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    else localStorage.removeItem(LOCATION_STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode, blocked): location just won't persist.
  }
}

const GEO_ERRORS: Record<number, string> = {
  1: 'Location permission was denied. Enter a ZIP code instead.',
};
const GEO_FALLBACK_ERROR = "Couldn't get your location. Enter a ZIP code instead.";

/** Safe to read storage in the initializer: the explorer is client-only (ssr: false). */
export function useUserLocation() {
  const [location, setLocationState] = useState<UserLocation | null>(readStored);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const setLocation = useCallback((next: UserLocation | null) => {
    setLocationState(next);
    writeStored(next);
  }, []);

  const setFromZip = useCallback(
    async (input: string) => {
      const result = resolveZip(input, await loadZipTable());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setLocation({ label: `ZIP ${result.zip}`, coords: result.coords });
    },
    [setLocation],
  );

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError("Your browser doesn't support location. Enter a ZIP code instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setError(null);
        setLocation({ label: 'Your location', coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
      },
      (err) => {
        setLocating(false);
        setError(GEO_ERRORS[err.code] ?? GEO_FALLBACK_ERROR);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  }, [setLocation]);

  const clear = useCallback(() => {
    setError(null);
    setLocation(null);
  }, [setLocation]);

  return { location, error, locating, setFromZip, locate, clear };
}
```

- [ ] **Step 2: Travel estimates hook**

Create `src/hooks/useTravelEstimates.ts`:

```ts
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
```

- [ ] **Step 3: Location input**

Create `src/components/location/LocationInput.tsx`:

```tsx
'use client';

import { LocateFixed, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { UserLocation } from '@/lib/geo/stored-location';

type Props = {
  location: UserLocation | null;
  error: string | null;
  locating: boolean;
  onZip: (zip: string) => void;
  onLocate: () => void;
  onClear: () => void;
};

export function LocationInput({ location, error, locating, onZip, onLocate, onClear }: Props) {
  const [zip, setZip] = useState('');

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold">Starting from</h2>
      {location ? (
        <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4 text-sky-600" />
            {location.label}
          </span>
          <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear location">
            <X />
          </Button>
        </div>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onZip(zip);
          }}
        >
          <Input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="ZIP code"
            inputMode="numeric"
            autoComplete="postal-code"
            aria-label="ZIP code"
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            Set
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={onLocate} disabled={locating} aria-label="Use my location">
            <LocateFixed className={locating ? 'animate-pulse' : undefined} />
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      {location && <p className="text-xs text-muted-foreground">Distances are straight-line, not driving.</p>}
    </div>
  );
}
```

- [ ] **Step 4: Wire location into the explorer**

Replace `src/components/ResortExplorer.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { LocationInput } from '@/components/location/LocationInput';
import ResortMap from '@/components/map/ResortMap';
import { ResortDetails } from '@/components/resorts/ResortDetails';
import { ResortList } from '@/components/resorts/ResortList';
import { PASS_AFFILIATIONS } from '@/data/pass-affiliations';
import { PASSES } from '@/data/passes';
import { RATINGS } from '@/data/ratings';
import { RESORTS } from '@/data/resorts';
import { useResortFilters } from '@/hooks/useResortFilters';
import { useTravelEstimates } from '@/hooks/useTravelEstimates';
import { useUserLocation } from '@/hooks/useUserLocation';
import { CURRENT_SEASON } from '@/lib/config';
import { applyFilters } from '@/lib/filters/apply';
import { buildFilters } from '@/lib/filters/definitions';
import type { FilterContext } from '@/lib/filters/types';
import { affiliationsFor, buildPassIndex } from '@/lib/resort';
import { sortResorts, type SortKey } from '@/lib/sort';

const PASS_NAMES: ReadonlyMap<string, string> = new Map(PASSES.map((p) => [p.id, p.name]));
const PASS_INDEX = buildPassIndex(PASS_AFFILIATIONS, CURRENT_SEASON);
const FILTER_DEFS = buildFilters(RESORTS, PASSES);
const DETAILS_WIDTH = 400;

export default function ResortExplorer() {
  const filters = useResortFilters(FILTER_DEFS);
  const userLocation = useUserLocation();
  const travel = useTravelEstimates(userLocation.location, RESORTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('distance');

  const ctx = useMemo<FilterContext>(() => ({ travel, passesByResort: PASS_INDEX }), [travel]);
  const filtered = useMemo(() => applyFilters(RESORTS, FILTER_DEFS, filters.state, ctx), [filters.state, ctx]);
  const sorted = useMemo(() => sortResorts(filtered, sortKey, travel), [filtered, sortKey, travel]);

  // A selection hidden by the filters closes its details.
  const selected = filtered.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="grid h-dvh grid-cols-[360px_1fr]">
      <aside className="space-y-6 overflow-y-auto border-r p-4">
        <h1 className="text-lg font-semibold">New England Ski Resorts</h1>
        <LocationInput
          location={userLocation.location}
          error={userLocation.error}
          locating={userLocation.locating}
          onZip={userLocation.setFromZip}
          onLocate={userLocation.locate}
          onClear={userLocation.clear}
        />
        <FilterPanel
          defs={FILTER_DEFS}
          state={filters.state}
          onChange={filters.setValue}
          onClear={filters.clear}
          activeCount={filters.activeCount}
          hasLocation={travel.size > 0}
        />
        <ResortList
          resorts={sorted}
          selectedId={selected?.id ?? null}
          onSelect={setSelectedId}
          travel={travel}
          passIndex={PASS_INDEX}
          passNames={PASS_NAMES}
          sortKey={sortKey}
          onSortChange={setSortKey}
          onClearFilters={filters.clear}
        />
      </aside>

      <main className="relative">
        <ResortMap
          resorts={filtered}
          selected={selected}
          onSelect={setSelectedId}
          userLocation={userLocation.location?.coords ?? null}
          focusPadding={{ right: selected ? DETAILS_WIDTH : 0 }}
        />
        {selected && (
          <div
            className="absolute inset-y-3 right-3 overflow-y-auto rounded-lg bg-background p-4 shadow-lg"
            style={{ width: DETAILS_WIDTH - 24 }}
          >
            <ResortDetails
              resort={selected}
              affiliations={affiliationsFor(selected.id, PASS_AFFILIATIONS, CURRENT_SEASON)}
              passNames={PASS_NAMES}
              ratings={RATINGS.filter((r) => r.resortId === selected.id)}
              travel={travel.get(selected.id)}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck, lint, build**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass. If lint flags `react-hooks/set-state-in-effect` in `useTravelEstimates`, confirm the `setResult` call is inside the `.then` callback (asynchronous), which the rule permits.

- [ ] **Step 6: Manual check**

Run: `npm run dev`.
Expected:
- Entering `01760` + Set → shows "ZIP 01760", a blue "you" dot near Natick on the map, distances on every card (e.g. Killington ≈ 118 mi), list sorted by distance, "Max distance" slider enabled.
- Max distance "Up to 100 mi" hides Killington and Sunday River from list and map.
- Entering `1760` → "Enter a 5-digit ZIP code."; `10001` → "That ZIP isn't in New England…".
- Use-my-location button: allow → "Your location"; deny → "Location permission was denied…".
- Reload the page → location persists. Clear (X) → distances disappear, distance filter disabled and no longer hides anything, sort falls back to name.
- Details panel shows "N mi (straight-line)" when a location is set.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add ZIP and geolocation input with straight-line distances and distance filter"
```

---

### Task 7: Responsive layout — mobile map, filter sheet, bottom sheet

**Files:**
- Create: `src/hooks/useIsDesktop.ts`, `src/components/layout/MobileSheet.tsx`
- Modify: `src/components/ResortExplorer.tsx` (full replacement)

**Interfaces:**
- Consumes: everything from Tasks 4–6; shadcn `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetTrigger`; `vaul`'s `Drawer`.
- Produces:
  - `useIsDesktop(): boolean` (true at ≥ 1024 px)
  - `MobileSheet` props `{ title: string; activeSnap: SnapPoint; onActiveSnapChange: (s: SnapPoint) => void; children: React.ReactNode }`; exports `SNAP_POINTS` and `type SnapPoint = string | number`

- [ ] **Step 1: Media query hook**

Create `src/hooks/useIsDesktop.ts`:

```ts
import { useSyncExternalStore } from 'react';

const QUERY = '(min-width: 1024px)';

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  );
}
```

- [ ] **Step 2: Mobile bottom sheet**

Create `src/components/layout/MobileSheet.tsx`:

```tsx
'use client';

import { Drawer } from 'vaul';

export type SnapPoint = string | number;

/** Peek (header + a card), half screen, near-full. */
export const SNAP_POINTS: SnapPoint[] = ['148px', 0.5, 0.92];

type Props = {
  title: string;
  activeSnap: SnapPoint;
  onActiveSnapChange: (snap: SnapPoint) => void;
  children: React.ReactNode;
};

/** Always-open, non-modal sheet: the map stays interactive above it. */
export function MobileSheet({ title, activeSnap, onActiveSnapChange, children }: Props) {
  return (
    <Drawer.Root
      open
      modal={false}
      dismissible={false}
      snapPoints={SNAP_POINTS}
      activeSnapPoint={activeSnap}
      setActiveSnapPoint={(s) => onActiveSnapChange(s ?? SNAP_POINTS[0])}
    >
      <Drawer.Portal>
        <Drawer.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-20 flex h-full max-h-[97dvh] flex-col rounded-t-2xl border-t bg-background shadow-[0_-4px_16px_rgba(0,0,0,0.12)] outline-none"
        >
          <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
          <Drawer.Title className="px-4 py-2 text-sm font-semibold">{title}</Drawer.Title>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

- [ ] **Step 3: Responsive explorer**

Replace `src/components/ResortExplorer.tsx`:

```tsx
'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { MobileSheet, SNAP_POINTS, type SnapPoint } from '@/components/layout/MobileSheet';
import { LocationInput } from '@/components/location/LocationInput';
import ResortMap from '@/components/map/ResortMap';
import { ResortDetails } from '@/components/resorts/ResortDetails';
import { ResortList } from '@/components/resorts/ResortList';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PASS_AFFILIATIONS } from '@/data/pass-affiliations';
import { PASSES } from '@/data/passes';
import { RATINGS } from '@/data/ratings';
import { RESORTS } from '@/data/resorts';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useResortFilters } from '@/hooks/useResortFilters';
import { useTravelEstimates } from '@/hooks/useTravelEstimates';
import { useUserLocation } from '@/hooks/useUserLocation';
import { CURRENT_SEASON } from '@/lib/config';
import { applyFilters } from '@/lib/filters/apply';
import { buildFilters } from '@/lib/filters/definitions';
import type { FilterContext } from '@/lib/filters/types';
import { affiliationsFor, buildPassIndex } from '@/lib/resort';
import { sortResorts, type SortKey } from '@/lib/sort';

const PASS_NAMES: ReadonlyMap<string, string> = new Map(PASSES.map((p) => [p.id, p.name]));
const PASS_INDEX = buildPassIndex(PASS_AFFILIATIONS, CURRENT_SEASON);
const FILTER_DEFS = buildFilters(RESORTS, PASSES);
const DETAILS_WIDTH = 400;

export default function ResortExplorer() {
  const isDesktop = useIsDesktop();
  const filters = useResortFilters(FILTER_DEFS);
  const userLocation = useUserLocation();
  const travel = useTravelEstimates(userLocation.location, RESORTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('distance');
  const [snap, setSnap] = useState<SnapPoint>(SNAP_POINTS[0]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const ctx = useMemo<FilterContext>(() => ({ travel, passesByResort: PASS_INDEX }), [travel]);
  const filtered = useMemo(() => applyFilters(RESORTS, FILTER_DEFS, filters.state, ctx), [filters.state, ctx]);
  const sorted = useMemo(() => sortResorts(filtered, sortKey, travel), [filtered, sortKey, travel]);

  // A selection hidden by the filters closes its details.
  const selected = filtered.find((r) => r.id === selectedId) ?? null;

  const select = (id: string) => {
    setSelectedId(id);
    if (!isDesktop) setSnap(SNAP_POINTS[1]);
  };
  const closeDetails = () => setSelectedId(null);

  const locationInput = (
    <LocationInput
      location={userLocation.location}
      error={userLocation.error}
      locating={userLocation.locating}
      onZip={userLocation.setFromZip}
      onLocate={userLocation.locate}
      onClear={userLocation.clear}
    />
  );

  const filterPanel = (
    <FilterPanel
      defs={FILTER_DEFS}
      state={filters.state}
      onChange={filters.setValue}
      onClear={filters.clear}
      activeCount={filters.activeCount}
      hasLocation={travel.size > 0}
    />
  );

  const list = (
    <ResortList
      resorts={sorted}
      selectedId={selected?.id ?? null}
      onSelect={select}
      travel={travel}
      passIndex={PASS_INDEX}
      passNames={PASS_NAMES}
      sortKey={sortKey}
      onSortChange={setSortKey}
      onClearFilters={filters.clear}
    />
  );

  const details = selected && (
    <ResortDetails
      resort={selected}
      affiliations={affiliationsFor(selected.id, PASS_AFFILIATIONS, CURRENT_SEASON)}
      passNames={PASS_NAMES}
      ratings={RATINGS.filter((r) => r.resortId === selected.id)}
      travel={travel.get(selected.id)}
      onClose={closeDetails}
    />
  );

  const map = (
    <ResortMap
      resorts={filtered}
      selected={selected}
      onSelect={select}
      userLocation={userLocation.location?.coords ?? null}
      focusPadding={
        isDesktop
          ? { right: selected ? DETAILS_WIDTH : 0 }
          : { bottom: selected ? Math.round(window.innerHeight * 0.5) : 0 }
      }
    />
  );

  if (isDesktop) {
    return (
      <div className="grid h-dvh grid-cols-[360px_1fr]">
        <aside className="space-y-6 overflow-y-auto border-r p-4">
          <h1 className="text-lg font-semibold">New England Ski Resorts</h1>
          {locationInput}
          {filterPanel}
          {list}
        </aside>
        <main className="relative">
          {map}
          {details && (
            <div
              className="absolute inset-y-3 right-3 overflow-y-auto rounded-lg bg-background p-4 shadow-lg"
              style={{ width: DETAILS_WIDTH - 24 }}
            >
              {details}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="relative h-dvh overflow-hidden">
      {map}

      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 p-3">
        <span className="rounded-full bg-background/95 px-3 py-1.5 text-xs font-medium shadow">
          {userLocation.location ? `From ${userLocation.location.label}` : 'New England Ski Resorts'}
        </span>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="shadow">
              <SlidersHorizontal />
              Filters{filters.activeCount > 0 ? ` (${filters.activeCount})` : ''}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[90vw] max-w-sm overflow-y-auto p-4">
            <SheetHeader className="p-0">
              <SheetTitle>Location &amp; filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-6">
              {locationInput}
              {filterPanel}
              <Button className="w-full" onClick={() => setFiltersOpen(false)}>
                Show {filtered.length} {filtered.length === 1 ? 'resort' : 'resorts'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <MobileSheet
        title={selected ? selected.name : `${filtered.length} ${filtered.length === 1 ? 'resort' : 'resorts'}`}
        activeSnap={snap}
        onActiveSnapChange={setSnap}
      >
        {details ?? list}
      </MobileSheet>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck, lint, build**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 5: Manual check (desktop and mobile)**

Run: `npm run dev`. In browser devtools, toggle device emulation (e.g. iPhone 14, 390×844).
Expected on mobile:
- Full-screen map; top bar with label and "Filters" button.
- Bottom sheet peeks with "N resorts"; dragging up reveals the list; tapping a card or map dot switches the sheet to that resort's details at half height, and the map centers the resort above the sheet.
- The details close (X) returns the sheet to the list.
- "Filters" opens a left sheet with location + filters; "Show N resorts" closes it; the result count and map update.
- The map remains pannable/zoomable while the sheet is at peek height.

Expected on desktop (≥ 1024 px): identical to Task 6.

If vaul's drag is unreliable on a real device, keep the snap points but make the sheet's title row a button that cycles `SNAP_POINTS` (tap-to-expand) — report this in the task summary.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add mobile layout with bottom sheet and filter sheet"
```

---

### Task 8: Complete the researched dataset

**Files:**
- Modify: `src/data/resorts/{vermont,new-hampshire,maine,massachusetts,connecticut}.ts`, `src/data/pass-affiliations.ts`, possibly `src/data/passes.ts`

**Interfaces:**
- Consumes: `SkiResort`, `PassAffiliation`, `Pass` types; the validation test from Task 1.
- Produces: the full dataset (~48 resorts) — no code interface changes.

Work one state per commit. For each resort below, create an entry in exactly the shape of the Task 1 seed entries.

**Resort checklist** (ids in parentheses — use exactly these):

- **Vermont (`vermont.ts`)**: Killington (`killington`, re-verify), Pico (`pico`), Sugarbush (`sugarbush`), Stowe (`stowe`, re-verify), Jay Peak (`jay-peak`), Stratton (`stratton`), Okemo (`okemo`), Mount Snow (`mount-snow`), Smugglers' Notch (`smugglers-notch`), Bolton Valley (`bolton-valley`), Mad River Glen (`mad-river-glen`), Burke (`burke`), Magic Mountain (`magic-mountain`), Bromley (`bromley`), Saskadena Six (`saskadena-six`, `formerNames: ['Suicide Six']`), Middlebury Snow Bowl (`middlebury-snow-bowl`).
- **New Hampshire (`new-hampshire.ts`)**: Bretton Woods (`bretton-woods`), Loon (`loon`), Cannon (`cannon`), Waterville Valley (`waterville-valley`), Wildcat (`wildcat`), Attitash (`attitash`), Gunstock (`gunstock`), Pats Peak (`pats-peak`), Mount Sunapee (`mount-sunapee`), Cranmore (`cranmore`), Black Mountain (`black-mountain-nh`), Ragged Mountain (`ragged-mountain`), Crotched (`crotched`), Tenney (`tenney`), Whaleback (`whaleback`), Dartmouth Skiway (`dartmouth-skiway`).
- **Maine (`maine.ts`)**: Sunday River (`sunday-river`, re-verify), Sugarloaf (`sugarloaf`), Saddleback (`saddleback`), Pleasant Mountain (`pleasant-mountain`, `formerNames: ['Shawnee Peak']`), Mount Abram (`mount-abram`), Black Mountain of Maine (`black-mountain-me`), Big Moose Mountain (`big-moose`, `formerNames: ['Big Squaw']`), Camden Snow Bowl (`camden-snow-bowl`).
- **Massachusetts (`massachusetts.ts`)**: Wachusett (`wachusett`, re-verify), Jiminy Peak (`jiminy-peak`), Berkshire East (`berkshire-east`), Catamount (`catamount`, state `MA`; note in `description` that it straddles the NY line), Butternut (`butternut`), Bousquet (`bousquet`).
- **Connecticut (`connecticut.ts`)**: Mohawk Mountain (`mohawk-mountain`), Ski Sundown (`ski-sundown`), Powder Ridge (`powder-ridge`, only if verified vertical ≥ 500 ft).

**Research rules (apply to every entry):**
1. Primary source: the resort's official site (mountain stats / "about" / trail map page). Cross-check with Wikipedia and OnTheSnow. If sources disagree, use the official figure. If no source states a value, omit the field.
2. **Operating status:** confirm the area is operating for 2026-27 (official site / recent news). If not, skip it and note this in the commit message.
3. **Inclusion rule:** if the verified vertical is < 500 ft, skip the resort (the data test will fail otherwise) and note it in the commit message.
4. `terrain`: record exactly what the resort publishes, set `basis` accordingly (`'trails'` if it is "% of trails", `'acreage'` if "% of terrain/acres"). If it publishes only green/blue/black, put black in `advanced` and omit `expert`. If unpublished, omit `terrain`.
5. `features.nightSkiing`: `true` only if the resort currently advertises night skiing; `false` if it clearly doesn't; omit if unclear.
6. `location`: main base lodge coordinates from OpenStreetMap, 4 decimals; `town` = the town the resort lists in its address.
7. `links.website`: official homepage. `links.trailMaps`: the official trail map page or PDF (`kind` accordingly), always `license: 'link-only'`.
8. `description`: one or two factual sentences (location, number of peaks, notable facts like ownership or co-op status). No adjectives like "best", "amazing", "family-friendly".
9. `meta.sources`: the specific URLs actually used, each with `retrievedAt` = the research date; `meta.lastVerified` = the research date.
10. **Passes (2026-27):** from each pass's official destination list (Epic, Ikon, Indy, Mountain Collective). Record access level (`unlimited`, `limited` for blackout-date/restricted access, or `days` with the day count for the top-tier pass product); put product nuances in `notes` (e.g. `'Ikon Base: 5 days'`). If a resort participates in another significant multi-resort pass, add that pass to `passes.ts` (kebab-case id, official website) and its affiliations. `source.url` = the pass's page for that resort.

- [ ] **Step 1: Vermont** — research and enter all 16 Vermont resorts and their affiliations. Run `npm test`; expected PASS. Commit: `git commit -am "Add researched Vermont resort data"`.
- [ ] **Step 2: New Hampshire** — same for 16 NH resorts. Run `npm test`; expected PASS. Commit: `"Add researched New Hampshire resort data"`.
- [ ] **Step 3: Maine** — same for 8 Maine resorts. Run `npm test`; expected PASS. Commit: `"Add researched Maine resort data"`.
- [ ] **Step 4: Massachusetts** — same for 6 MA resorts. Run `npm test`; expected PASS. Commit: `"Add researched Massachusetts resort data"`.
- [ ] **Step 5: Connecticut** — same for 2–3 CT resorts. Run `npm test`; expected PASS. Commit: `"Add researched Connecticut resort data"`.
- [ ] **Step 6: Whole-app check**

Run: `npm test && npm run build && npm run dev`.
Expected: list shows ~48 resorts; state chips show VT, NH, ME, MA, CT (no RI); clusters look reasonable across the map; each pass filter returns a plausible set; spot-check 5 random resorts' details against their official sites and confirm the trail-map links open the official map.

---

### Task 9: Docker image for local runs

**Files:**
- Create: `Dockerfile`, `.dockerignore`
- Modify: `README.md`

**Interfaces:**
- Consumes: `output: 'standalone'` from Task 1.
- Produces: `docker build -t ski-trip-planner . && docker run -p 3000:3000 ski-trip-planner`.

- [ ] **Step 1: Write the Dockerfile**

Create `Dockerfile`:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

Create `.dockerignore`:

```
node_modules
.next
.git
docs
npm-debug.log*
```

- [ ] **Step 2: Build and run**

Run: `docker build -t ski-trip-planner . && docker run --rm -p 3000:3000 ski-trip-planner`
Expected: container starts; http://localhost:3000 shows the app with map, filters, and list. If Docker is not installed on this machine, report that this step was not verified.

- [ ] **Step 3: Document**

Append to `README.md`:

````markdown
## Run with Docker

```bash
docker build -t ski-trip-planner .
docker run --rm -p 3000:3000 ski-trip-planner   # http://localhost:3000
```
````

- [ ] **Step 4: Commit**

```bash
git add Dockerfile .dockerignore README.md
git commit -m "Add Dockerfile for running the app locally"
```
