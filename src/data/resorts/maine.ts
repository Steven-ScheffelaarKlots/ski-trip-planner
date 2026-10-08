import type { SkiResort } from '@/lib/types';

export const MAINE_RESORTS: SkiResort[] = [
  {
    id: 'sunday-river',
    name: 'Sunday River',
    location: { state: 'ME', town: 'Newry', lat: 44.4734, lng: -70.8569 },
    stats: { trailCount: 135, skiableAcres: 870, verticalFt: 2340, summitElevationFt: 3140, baseElevationFt: 800 },
    terrain: { basis: 'trails', beginner: 33, intermediate: 36, advanced: 19, expert: 12 },
    features: {},
    links: { website: 'https://www.sundayriver.com' },
    description: 'Ski resort spanning eight interconnected peaks near Bethel in western Maine. Owned by Boyne Resorts.',
    meta: {
      lastVerified: '2026-10-08',
      sources: [
        { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Sunday_River_(ski_resort)', retrievedAt: '2026-10-08' },
      ],
    },
  },
];
