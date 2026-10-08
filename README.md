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

## Run with Docker

```bash
docker build -t ski-trip-planner .
docker run --rm -p 3000:3000 ski-trip-planner   # http://localhost:3000
```
