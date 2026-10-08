import type { SkiResort } from '@/lib/types';

export const MASSACHUSETTS_RESORTS: SkiResort[] = [
  {
    id: 'wachusett',
    name: 'Wachusett Mountain',
    location: { state: 'MA', town: 'Princeton', lat: 42.4994, lng: -71.8864 },
    stats: {
      trailCount: 27,
      skiableAcres: 110,
      verticalFt: 1000,
      summitElevationFt: 2006,
      baseElevationFt: 1000,
      liftCount: 8,
    },
    terrain: { basis: 'trails', beginner: 19, intermediate: 63, advanced: 19 },
    features: { nightSkiing: true, snowmakingPercent: 100 },
    links: {
      website: 'https://www.wachusett.com',
      trailMaps: [
        { url: 'https://www.wachusett.com/the-mountain/about-wachusett/trail-map/', kind: 'page', license: 'link-only' },
      ],
    },
    description: 'Ski area in central Massachusetts, about an hour west of Boston, with night skiing.',
    meta: {
      lastVerified: '2026-10-08',
      sources: [
        {
          label: 'Wachusett trail map & stats',
          url: 'https://www.wachusett.com/the-mountain/about-wachusett/trail-map/',
          retrievedAt: '2026-10-08',
        },
        { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Wachusett_Mountain_Ski_Area', retrievedAt: '2026-10-08' },
      ],
    },
  },
];
