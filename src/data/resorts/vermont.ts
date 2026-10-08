import type { SkiResort } from '@/lib/types';

export const VERMONT_RESORTS: SkiResort[] = [
  {
    id: 'killington',
    name: 'Killington',
    location: { state: 'VT', town: 'Killington', lat: 43.6262, lng: -72.7967 },
    stats: {
      trailCount: 155,
      skiableAcres: 1509,
      verticalFt: 3076,
      summitElevationFt: 4241,
      baseElevationFt: 1165,
      liftCount: 21,
    },
    terrain: { basis: 'trails', beginner: 28, intermediate: 33, advanced: 39 },
    features: { nightSkiing: false, snowmakingPercent: 71 },
    links: {
      website: 'https://www.killington.com',
      trailMaps: [{ url: 'https://www.killington.com/the-mountain/trail-maps', kind: 'page', license: 'link-only' }],
    },
    description: 'The largest ski area in the eastern US, spread across six interconnected peaks in central Vermont.',
    meta: {
      lastVerified: '2026-10-08',
      sources: [
        {
          label: 'Killington mountain statistics',
          url: 'https://killington.helpjuice.com/other/mountain-statistics',
          retrievedAt: '2026-10-08',
        },
        { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Killington_Ski_Resort', retrievedAt: '2026-10-08' },
      ],
    },
  },
  {
    id: 'stowe',
    name: 'Stowe',
    location: { state: 'VT', town: 'Stowe', lat: 44.5319, lng: -72.7875 },
    stats: {
      trailCount: 116,
      skiableAcres: 485,
      verticalFt: 2360,
      summitElevationFt: 3719,
      baseElevationFt: 1559,
      liftCount: 12,
    },
    terrain: { basis: 'trails', beginner: 16, intermediate: 55, advanced: 30 },
    features: { nightSkiing: false, snowmakingPercent: 83 },
    links: {
      website: 'https://www.stowe.com',
      trailMaps: [
        { url: 'https://www.stowe.com/the-mountain/about-the-mountain/trail-map.aspx', kind: 'page', license: 'link-only' },
      ],
    },
    description: "Ski resort on Mount Mansfield, Vermont's highest peak, and neighboring Spruce Peak. Owned by Vail Resorts.",
    meta: {
      lastVerified: '2026-10-08',
      sources: [
        { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Stowe_Mountain_Resort', retrievedAt: '2026-10-08' },
        {
          label: 'Stowe trail maps',
          url: 'https://www.stowe.com/the-mountain/about-the-mountain/trail-map.aspx',
          retrievedAt: '2026-10-08',
        },
      ],
    },
  },
];
