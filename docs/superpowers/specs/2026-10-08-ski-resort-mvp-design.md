# New England Ski Resort Explorer — MVP Design

Date: 2026-10-08
Status: Draft — awaiting review

## 1. Goal

Help a skier answer **"What are my options?"** for New England skiing: given where they live, their pass, the terrain their group needs, and how far they will travel, show the matching resorts on a map and in a list.

The MVP is a filter-and-explore tool. Ranking/recommendation, comparison, and trip planning come later; the data model and module boundaries must make them straightforward to add.

### Constraints

- Next.js + React + TypeScript; Tailwind CSS.
- No database, no authentication, no separate backend service.
- Resort data lives in typed TypeScript files in the repo.
- Subjective attributes (après, nightlife, etc.) are never invented or presented as fact.
- US units (miles, feet).
- Hosting is undecided: possibly AWS Amplify, possibly local Docker, possibly never deployed. The app must not depend on any host-specific features.

### Success criteria

- A user can enter a ZIP (or use browser geolocation), pick a pass and a few terrain/size filters, and immediately see matching resorts on the map and in a list sorted by distance.
- Clicking any resort shows its details, including a link to its official trail map.
- Works on desktop and on a phone.
- Adding a resort means adding one object to one file; an automated test catches malformed data.

## 2. Architecture

```
Browser (Next.js App Router, client-rendered page)
 ├─ src/data/            typed static data bundled into the app
 │    resorts/*.ts       ~48 curated resorts, one file per state
 │    passes.ts          pass registry
 │    pass-affiliations.ts  resort↔pass membership, per season
 │    ratings.ts         sourced subjective ratings (empty at launch)
 │    zip-centroids.json New England ZIP → lat/lng (US Census ZCTA gazetteer, public domain)
 ├─ src/lib/             pure, framework-free, unit-tested logic
 │    filters, geo (distance, ZIP lookup, travel estimates), resort-derived values
 └─ src/components/      map, filter panel, list, details, location input, layout
```

**No backend.** Every MVP feature runs client-side: data is bundled (a few KB), ZIP lookup is a local table, distance is computed with the haversine formula, and geolocation is a browser API.

**When server code becomes justified** (still inside the same Next.js app, as route handlers — not a separate service):

- Routing API for real driving times (hides an API key, caches results).
- Free-text address geocoding (keeps us within a free geocoder's usage policy).
- Weather/snow data caching.

None of these are in the MVP.

**Hosting.** Set `output: 'standalone'` in `next.config` so the app can run in a small Docker image. AWS Amplify Hosting builds Next.js apps natively; compatibility will be checked if/when we deploy there. A `Dockerfile` is the final, optional implementation step.

## 3. Libraries

| Purpose | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router), React, TypeScript strict | |
| Styling | Tailwind CSS v4 | |
| UI primitives | shadcn/ui (Slider, Checkbox, Sheet, Drawer) | copied into repo, not a runtime dependency |
| Map | `maplibre-gl` + `react-map-gl/maplibre` | built-in GeoJSON clustering, WebGL, mobile-friendly, 3D terrain possible later |
| Map tiles | OpenFreeMap (no API key) | style URL in one config constant so the provider can be swapped |
| Tests | Vitest | pure logic + data validation |

Deliberately not used: global state library, database/ORM, form library, backend framework.

The map component is client-only (`next/dynamic` with `ssr: false`) because MapLibre requires `window`.

## 4. Project structure

```
src/
  app/
    layout.tsx
    page.tsx
    globals.css
  components/
    map/          ResortMap.tsx, map layers (clusters, points, selected)
    filters/      FilterPanel.tsx, RangeFilter.tsx, MultiSelectFilter.tsx, ToggleFilter.tsx
    resorts/      ResortList.tsx, ResortCard.tsx, ResortDetails.tsx
    location/     LocationInput.tsx
    layout/       AppShell.tsx, MobileSheet.tsx
    ui/           shadcn components
  data/
    resorts/      vermont.ts, new-hampshire.ts, maine.ts, massachusetts.ts, connecticut.ts, index.ts
    passes.ts
    pass-affiliations.ts
    ratings.ts
    zip-centroids.json
  lib/
    types.ts
    resort.ts             derived values (size class, terrain helpers)
    filters/
      definitions.ts      filter registry
      apply.ts            applyFilters()
    geo/
      distance.ts         haversine
      geocode.ts          ZIP → coordinates
      travel.ts           TravelEstimator interface + straight-line implementation
    config.ts             map style URL, New England bounds, size-class thresholds
  hooks/
    useResortFilters.ts
    useUserLocation.ts
```

Rhode Island has no file at launch (see §6) but `StateCode` includes it.

## 5. Data model

```ts
type StateCode = 'VT' | 'NH' | 'ME' | 'MA' | 'CT' | 'RI';

type SourceRef = { label: string; url: string; retrievedAt: string /* ISO date */ };

type TrailMapRef = {
  url: string;
  kind: 'page' | 'pdf' | 'image';
  license: 'link-only' | 'embeddable';   // MVP: everything is 'link-only'
};

type SkiResort = {
  id: string;                    // stable kebab-case slug, e.g. 'pleasant-mountain'
  name: string;
  formerNames?: string[];        // e.g. ['Shawnee Peak']; used for search and disambiguation
  location: { state: StateCode; town?: string; lat: number; lng: number };
  stats: {
    trailCount?: number;
    skiableAcres?: number;
    verticalFt?: number;
    summitElevationFt?: number;
    baseElevationFt?: number;
    liftCount?: number;
  };
  terrain?: {                    // percentages, 0–100
    basis: 'trails' | 'acreage'; // what the resort's percentages are measured against
    beginner?: number;           // green
    intermediate?: number;       // blue
    advanced?: number;           // black
    expert?: number;             // double black
  };
  features: {
    nightSkiing?: boolean;
    terrainPark?: boolean;
    snowmakingPercent?: number;
  };
  links: { website?: string; trailMaps?: TrailMapRef[] };
  description?: string;          // short, factual, written by us
  meta: { lastVerified: string; sources: SourceRef[] };
};

type PassId = 'epic' | 'ikon' | 'indy' | 'mountain-collective' | (string & {});

type Pass = { id: PassId; name: string; website: string };

// Kept separate from SkiResort because pass deals change every season.
type PassAffiliation = {
  resortId: string;
  passId: PassId;
  season: string;                // '2026-27'
  access: 'unlimited' | 'limited' | 'days';
  days?: number;                 // when access === 'days'
  notes?: string;                // e.g. 'blackout dates apply'
  source: SourceRef;
};

// Subjective, sourced. No rating exists without a methodology and sources.
type RatingAttribute =
  | 'beginnerFriendly' | 'expertFriendly' | 'apres' | 'nightlife' | 'familyFriendly'
  | 'terrainVariety' | 'snowQuality' | 'crowding' | 'atmosphere';

type ResortRating = {
  resortId: string;
  attribute: RatingAttribute;
  value: number;                 // 1–5
  method: 'editorial' | 'aggregated-reviews' | 'llm-summary';
  sources: SourceRef[];
  asOf: string;
};

// The UI consumes this shape; today it is straight-line, later routing.
type TravelEstimate = {
  resortId: string;
  miles: number;
  minutes?: number;              // only populated by a routing provider
  method: 'straight-line' | 'routing';
};

interface TravelEstimator {
  estimate(origin: LatLng, resorts: SkiResort[]): Promise<TravelEstimate[]>;
}
```

### Data conventions

- Unknown or unverifiable values are **omitted**, never guessed.
- Terrain percentages: if a resort reports only "black" (combined black + double black), record it as `advanced` and leave `expert` undefined.
- `ratings.ts` ships empty. The details panel shows "No community ratings yet" for that section.

### Derived values (computed, not stored)

- **Size class** from `verticalFt`, thresholds in `config.ts`:
  small < 1,000 ft · medium 1,000–1,999 ft · large ≥ 2,000 ft.
- **Passes for a resort**: affiliations filtered to the current season.

## 6. Initial dataset

### Inclusion rule

Currently operating alpine ski areas in New England with **≥ 500 ft vertical**. Local hills below that cutoff are excluded from the MVP; adding them later is just adding data. Borderline cases are decided by the verified vertical figure during research.

### Planned list (~48)

- **Vermont (16):** Killington, Pico, Sugarbush, Stowe, Jay Peak, Stratton, Okemo, Mount Snow, Smugglers' Notch, Bolton Valley, Mad River Glen, Burke, Magic Mountain, Bromley, Saskadena Six (formerly Suicide Six), Middlebury Snow Bowl.
- **New Hampshire (16):** Bretton Woods, Loon, Cannon, Waterville Valley, Wildcat, Attitash, Gunstock, Pats Peak, Mount Sunapee, Cranmore, Black Mountain, Ragged Mountain, Crotched, Tenney, Whaleback, Dartmouth Skiway.
- **Maine (8):** Sunday River, Sugarloaf, Saddleback, Pleasant Mountain (formerly Shawnee Peak), Mount Abram, Black Mountain of Maine, Big Moose Mountain (formerly Big Squaw), Camden Snow Bowl.
- **Massachusetts (6):** Wachusett, Jiminy Peak, Berkshire East, Catamount (straddles the NY line; listed under MA), Butternut, Bousquet.
- **Connecticut (2–3):** Mohawk Mountain, Ski Sundown, Powder Ridge (if verified ≥ 500 ft).

**Excluded under the cutoff** (expected): Blue Hills, Ski Ward, Nashoba Valley, Bradford, Otis Ridge (MA); Mount Southington, Woodbury (CT); Lost Valley (ME); King Pine (NH); Yawgoo Valley (RI). As a result, **Rhode Island has no resorts in the MVP**; the RI option is hidden from the state filter until it has data.

### Research process

1. Research state by state. Primary source: the resort's official website. Cross-check with Wikipedia, OnTheSnow, and skimap.org. Record source URLs and `lastVerified` per resort.
2. Verify **2026-27** pass membership on the official Epic, Ikon, Indy, and Mountain Collective sites, including access level (unlimited / limited / N days).
3. Write a short factual description per resort (no subjective claims).
4. Trail map links point to the resort's official trail map page or PDF.

### Data validation test (Vitest)

- Resort ids unique and kebab-case.
- Coordinates within a New England bounding box.
- Terrain percentages sum to 95–105 when all four reported categories are present.
- Every `PassAffiliation.resortId` and `passId` exists.
- All URLs are valid `https://`.
- All ratings have at least one source.

## 7. Features (MVP)

### 7.1 Map

- All filtered resorts as points; GeoJSON clustering when zoomed out (cluster bubbles show counts, click to zoom in).
- Hover (desktop) shows a name tooltip; tap/click selects a resort and opens details.
- Selected resort is visually highlighted.
- Initial view fits New England bounds. When the user sets a location, show a "you" marker.
- Map and list always reflect the same filtered set.

### 7.2 Filters

Filters are declared in a registry (`lib/filters/definitions.ts`):

```ts
type FilterDefinition<V> = {
  id: string;
  label: string;
  control: 'range' | 'multi-select' | 'toggle';
  // control-specific config (min/max/step/options)
  isActive(value: V): boolean;
  predicate(resort: SkiResort, value: V, ctx: FilterContext): boolean;
};
// FilterContext carries derived data: travel estimates, pass affiliations.
```

`FilterPanel` renders controls from the registry, and `applyFilters(resorts, state, ctx)` runs every active predicate. Adding a filter is one registry entry.

MVP filters:

| Filter | Control | Logic |
|---|---|---|
| State | multi-select | resort state in selection |
| Mountain size | multi-select | derived size class |
| Pass | multi-select | resort has any selected pass in current season |
| Vertical drop (ft) | range | |
| Trail count | range | |
| Skiable acres | range | |
| Max distance (mi, straight-line) | range | only enabled once a location is set |
| Night skiing | toggle | |
| Beginner terrain | toggle "≥ 20% beginner terrain" | uses objective terrain %, labeled as such |
| Expert terrain | toggle "≥ 15% advanced/expert terrain" | uses objective terrain % |

Range filters exclude resorts missing that stat only when the filter is active. A "Clear all" button resets everything. The active-result count is always visible ("23 resorts").

### 7.3 Resort list

- Cards with name, state, vertical, trail count, pass badges, and distance (when a location is set).
- Sort: distance (default once a location exists), vertical, trail count, name.
- Clicking a card selects the resort (map flies to it, details open).

### 7.4 Resort details

Side panel (desktop) / bottom sheet (mobile) showing:

- Name, former names, town and state, coordinates.
- Stats: trails, acres, vertical, summit/base elevation, lifts.
- Terrain breakdown bar (labeled with its basis: "% of trails" or "% of acreage").
- Night skiing, terrain park, snowmaking.
- Pass affiliations with access level and season.
- Website and official trail map link(s).
- Description.
- Ratings section ("No community ratings yet" at launch).
- "Data last verified <date>" with source links.

### 7.5 User location

- ZIP code input (validated against the New England ZIP table; a clear message for unknown ZIPs) or a "Use my location" button (browser geolocation, with handling for denied permission).
- The location produces `TravelEstimate`s via the straight-line `TravelEstimator`. Distances are labeled "mi (straight-line)". No fake drive times are shown.
- Location persists in `localStorage` for convenience (wrapped in try/catch; the app works without it).

## 8. Layout

**Desktop (≥ 1024 px):** left column (~360 px) with location input, filters, and the resort list (scrollable); map fills the rest. The details panel overlays the right side of the map.

**Mobile:** full-screen map with a top bar (location + "Filters" button with active count). Filters open in a full-height sheet. A draggable bottom sheet shows the resort list (collapsed state shows the result count); selecting a resort switches the bottom sheet to details.

## 9. Error handling

- Unknown ZIP → inline message, previous location kept.
- Geolocation denied/unavailable → inline message suggesting ZIP entry.
- Map tiles fail to load → map area shows a message; the list and filters keep working.
- No resorts match → empty state with "Clear filters" action.

## 10. Testing

- **Unit (Vitest):** haversine distance, ZIP lookup, size classification, every filter predicate, `applyFilters`, sorting.
- **Data validation** test as described in §6.
- **Manual:** run the dev server and check desktop and mobile viewports for the map, filters, list, details, and location flows.

## 11. Implementation order (each step leaves the app runnable)

1. Scaffold Next.js + TypeScript + Tailwind + Vitest; types; empty data modules.
2. Seed a few resorts and the pass registry; data validation test.
3. Map with markers and clustering; selection and details panel.
4. Filter registry, filter panel, and resort list wired to the map.
5. Location (ZIP + geolocation), distances, distance filter, and sorting.
6. Mobile layout (bottom sheet, filter sheet).
7. Complete the researched dataset (all ~48 resorts, 2026-27 passes).
8. Optional: `Dockerfile` (standalone output) for local Docker.

## 12. Future work (designed for, not built)

- **Comparison:** select 2–4 resorts for a side-by-side table (reads the same `SkiResort` + affiliations).
- **Ranking/trip planning:** `scoreResort(resort, prefs, ctx) → { score, breakdown }` as a pure function over the same `FilterContext`; trip inputs (origin, dates, party skill levels, passes, max drive time, desired characteristics).
- **Driving time:** a routing `TravelEstimator` (OpenRouteService or Mapbox matrix API) behind a Next.js route handler with caching; the distance filter switches to minutes.
- **Weather/snow:** Open-Meteo / NWS (no key needed), via a route handler with caching.
- **Ticket prices, historical snowfall, opening dates:** new data modules keyed by `resortId` with `SourceRef`s.
- **Subjective ratings:** an offline script fills `ratings.ts` from public sources (optionally LLM-summarized), each value carrying its method and sources.
- **Shareable URLs:** sync filter state to query params.
- **Small local hills:** extend the dataset below the 500 ft cutoff.

## 13. Risks

| Risk | Mitigation |
|---|---|
| Pass deals, ownership, and stats change yearly | season-tagged affiliations, `lastVerified`, source links shown in the UI |
| Straight-line distance understates mountain driving (often 1.3–1.6×) | label distances clearly; real routing is a planned upgrade |
| Inconsistent terrain reporting across resorts | `basis` field; omit unreported categories |
| Free tile provider has no SLA | style URL in one constant |
| MapLibre needs the browser | client-only dynamic import |
| Trail maps are copyrighted | link only; `license` field enables embedding later where permitted |
