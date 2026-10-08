import type { SkiResort, SourceRef } from '@/lib/types';

const RETRIEVED = '2026-10-08';
const wiki = (article: string): SourceRef => ({
  label: 'Wikipedia',
  url: `https://en.wikipedia.org/wiki/${article}`,
  retrievedAt: RETRIEVED,
});
const page = (label: string, url: string): SourceRef => ({ label, url, retrievedAt: RETRIEVED });

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
    meta: { lastVerified: RETRIEVED, sources: [wiki('Sunday_River_(ski_resort)')] },
  },
  {
    id: 'sugarloaf',
    name: 'Sugarloaf',
    location: { state: 'ME', town: 'Carrabassett Valley', lat: 45.0314, lng: -70.3131 },
    stats: {
      trailCount: 176,
      skiableAcres: 1360,
      verticalFt: 2820,
      summitElevationFt: 4237,
      baseElevationFt: 1417,
      liftCount: 15,
    },
    terrain: { basis: 'trails', beginner: 23, intermediate: 31, advanced: 25, expert: 21 },
    features: { nightSkiing: false, snowmakingPercent: 95 },
    links: { website: 'https://www.sugarloaf.com' },
    description: 'Large resort in western Maine with lift-served terrain above treeline. Owned by Boyne Resorts.',
    meta: { lastVerified: RETRIEVED, sources: [wiki('Sugarloaf_(ski_resort)')] },
  },
  {
    id: 'saddleback',
    name: 'Saddleback',
    location: { state: 'ME', town: 'Rangeley', lat: 44.9367, lng: -70.5031 },
    stats: {
      trailCount: 68,
      skiableAcres: 600,
      verticalFt: 2000,
      summitElevationFt: 4120,
      baseElevationFt: 2120,
      liftCount: 6,
    },
    terrain: { basis: 'trails', beginner: 38, intermediate: 29, advanced: 33 },
    features: { snowmakingPercent: 85 },
    links: {
      website: 'https://www.saddlebackmaine.com',
      trailMaps: [{ url: 'https://www.saddlebackmaine.com/trail-maps/', kind: 'page', license: 'link-only' }],
    },
    description: 'Ski area near Rangeley in western Maine. Owned by the Arctaris Impact Fund.',
    meta: { lastVerified: RETRIEVED, sources: [wiki('Saddleback_Maine')] },
  },
  {
    id: 'pleasant-mountain',
    name: 'Pleasant Mountain',
    formerNames: ['Shawnee Peak'],
    location: { state: 'ME', town: 'Bridgton', lat: 44.0583, lng: -70.8153 },
    stats: { trailCount: 44, skiableAcres: 245, verticalFt: 1300, liftCount: 6 },
    features: { nightSkiing: true, snowmakingPercent: 99 },
    links: {
      website: 'https://www.pleasantmountain.com',
      trailMaps: [{ url: 'https://www.pleasantmountain.com/trail-map', kind: 'page', license: 'link-only' }],
    },
    description:
      'Ski area near Bridgton that opened in 1938, with night skiing. Known as Shawnee Peak from 1988 until 2022, when owner Boyne Resorts restored the original name.',
    meta: {
      lastVerified: RETRIEVED,
      sources: [
        wiki('Pleasant_Mountain_Ski_Area'),
        page('Pleasant Mountain name restored (press release)', 'https://www.pleasantmountain.com/press-releases/2022-09-14-pleasant-mountain-name-restored'),
      ],
    },
  },
  {
    id: 'mount-abram',
    name: 'Mt. Abram',
    location: { state: 'ME', town: 'Greenwood', lat: 44.376, lng: -70.7123 },
    stats: { trailCount: 43, skiableAcres: 450, verticalFt: 1050, summitElevationFt: 2000, liftCount: 4 },
    terrain: { basis: 'trails', beginner: 35, intermediate: 42, advanced: 23 },
    features: { nightSkiing: false },
    links: {
      website: 'https://www.mtabram.com',
      trailMaps: [{ url: 'https://www.mtabram.com/winter/trail-map/', kind: 'page', license: 'link-only' }],
    },
    description: 'Ski area near Bethel in western Maine.',
    meta: {
      lastVerified: RETRIEVED,
      sources: [
        page('Indy Pass: Mt. Abram', 'https://indyskipass.com/our-resorts/mt-abram'),
        page('OpenStreetMap (coordinates)', 'https://nominatim.openstreetmap.org/search?q=Mt.+Abram,+Greenwood,+Maine'),
      ],
    },
  },
  {
    id: 'black-mountain-me',
    name: 'Black Mountain of Maine',
    location: { state: 'ME', town: 'Rumford', lat: 44.58, lng: -70.6175 },
    stats: { trailCount: 46, verticalFt: 1380, summitElevationFt: 2380, baseElevationFt: 1000, liftCount: 3 },
    features: { nightSkiing: true, snowmakingPercent: 90 },
    links: { website: 'https://www.skiblackmountain.org' },
    description: 'Nonprofit community ski area in Rumford, with night skiing.',
    meta: { lastVerified: RETRIEVED, sources: [wiki('Black_Mountain_of_Maine')] },
  },
  {
    id: 'big-moose',
    name: 'Big Moose Mountain',
    formerNames: ['Big Squaw'],
    location: { state: 'ME', town: 'Greenville Junction', lat: 45.4842, lng: -69.7117 },
    stats: { trailCount: 29, verticalFt: 600, liftCount: 2 },
    features: { nightSkiing: false },
    links: {
      website: 'https://skibigmoose.com',
      trailMaps: [{ url: 'https://skibigmoose.com/trail-map', kind: 'page', license: 'link-only' }],
    },
    description: 'Ski area near Moosehead Lake. The mountain was renamed from Big Squaw Mountain in 2000.',
    meta: {
      lastVerified: RETRIEVED,
      sources: [page('Indy Pass: Big Moose', 'https://indyskipass.com/our-resorts/big-moose'), wiki('Big_Moose_Mountain')],
    },
  },
  {
    id: 'camden-snow-bowl',
    name: 'Camden Snow Bowl',
    location: { state: 'ME', town: 'Camden', lat: 44.2172, lng: -69.1347 },
    stats: {
      trailCount: 15,
      skiableAcres: 105,
      verticalFt: 850,
      summitElevationFt: 1070,
      baseElevationFt: 220,
      liftCount: 3,
    },
    features: { nightSkiing: true, snowmakingPercent: 46 },
    links: {
      website: 'https://www.camdensnowbowl.com',
      trailMaps: [{ url: 'https://camdensnowbowl.com/ski-trail-map/', kind: 'page', license: 'link-only' }],
    },
    description: 'Town-owned ski area on Ragged Mountain overlooking Penobscot Bay.',
    meta: { lastVerified: RETRIEVED, sources: [wiki('Camden_Snow_Bowl')] },
  },
];
