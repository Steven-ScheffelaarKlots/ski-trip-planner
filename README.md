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

## Drive times

Drive times come from [OpenRouteService](https://openrouteservice.org) through the app's own
`/api/travel` route, so the API key stays on the server. Without a key the app still works and shows
rough estimates (straight-line distance × 1.25 at 55 mph).

- **Local:** copy `.env.example` to `.env.local` and set `ORS_API_KEY`.
- **Docker:** `docker run --rm -p 3000:3000 -e ORS_API_KEY=... ski-trip-planner`
- **AWS Amplify:** add `ORS_API_KEY` as an environment variable in the Amplify console;
  `amplify.yml` passes it to the server runtime.

The free OpenRouteService plan allows 500 matrix requests/day; each location lookup is one request
and results are cached per ~1 km location on the server.

## Adding a resort

Add an object to the matching file in `src/data/resorts/`, add any pass entries to
`src/data/pass-affiliations.ts`, and run `npm test`. Omit any value you cannot verify.

## Run with Docker

```bash
docker build -t ski-trip-planner .
docker run --rm -p 3000:3000 -e ORS_API_KEY=your-key ski-trip-planner   # http://localhost:3000
```
