import type { SkiResort, SourceRef } from '@/lib/types';

const RETRIEVED = '2026-10-08';
const wiki = (article: string): SourceRef => ({
  label: 'Wikipedia',
  url: `https://en.wikipedia.org/wiki/${article}`,
  retrievedAt: RETRIEVED,
});
const page = (label: string, url: string): SourceRef => ({ label, url, retrievedAt: RETRIEVED });

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
      lastVerified: RETRIEVED,
      sources: [
        page('Wachusett trail map & stats', 'https://www.wachusett.com/the-mountain/about-wachusett/trail-map/'),
        wiki('Wachusett_Mountain_Ski_Area'),
      ],
    },
  },
  {
    id: 'jiminy-peak',
    name: 'Jiminy Peak',
    location: { state: 'MA', town: 'Hancock', lat: 42.5508, lng: -73.2908 },
    stats: {
      trailCount: 45,
      skiableAcres: 170,
      verticalFt: 1150,
      summitElevationFt: 2375,
      baseElevationFt: 1245,
      liftCount: 9,
    },
    features: { nightSkiing: true },
    links: { website: 'https://www.jiminypeak.com' },
    description: 'Ski resort in the northern Berkshires with night skiing.',
    meta: {
      lastVerified: RETRIEVED,
      sources: [
        wiki('Jiminy_Peak_(ski_area)'),
        page('OnTheSnow', 'https://www.onthesnow.com/massachusetts/jiminy-peak/ski-resort'),
      ],
    },
  },
  {
    id: 'berkshire-east',
    name: 'Berkshire East',
    location: { state: 'MA', town: 'Charlemont', lat: 42.6122, lng: -72.8717 },
    stats: {
      trailCount: 45,
      skiableAcres: 180,
      verticalFt: 1180,
      summitElevationFt: 1840,
      baseElevationFt: 640,
      liftCount: 6,
    },
    terrain: { basis: 'trails', beginner: 30, intermediate: 35, advanced: 35 },
    features: { nightSkiing: true },
    links: {
      website: 'https://berkshireeast.com',
      trailMaps: [{ url: 'https://berkshireeast.com/plan/trail-maps', kind: 'page', license: 'link-only' }],
    },
    description: 'Ski area in the Deerfield River valley with night skiing.',
    meta: {
      lastVerified: RETRIEVED,
      sources: [
        page('Indy Pass: Berkshire East', 'https://indyskipass.com/our-resorts/berkshire-east-mountain-resort'),
        page('OpenStreetMap (coordinates)', 'https://nominatim.openstreetmap.org/search?q=Berkshire+East,+Charlemont'),
      ],
    },
  },
  {
    id: 'catamount',
    name: 'Catamount',
    location: { state: 'MA', town: 'South Egremont', lat: 42.1715, lng: -73.4778 },
    stats: {
      trailCount: 44,
      skiableAcres: 119,
      verticalFt: 1000,
      summitElevationFt: 2000,
      baseElevationFt: 1000,
      liftCount: 8,
    },
    features: { nightSkiing: true, snowmakingPercent: 82 },
    links: {
      website: 'https://www.catamountski.com',
      trailMaps: [{ url: 'https://www.catamountski.com/winter/the-mountain/trail-map', kind: 'page', license: 'link-only' }],
    },
    description: 'Ski area straddling the New York–Massachusetts line in the southern Berkshires, with night skiing.',
    meta: { lastVerified: RETRIEVED, sources: [wiki('Catamount_Ski_Area')] },
  },
  {
    id: 'butternut',
    name: 'Butternut',
    location: { state: 'MA', town: 'Great Barrington', lat: 42.1781, lng: -73.3169 },
    stats: { trailCount: 22, verticalFt: 1000, summitElevationFt: 1800, baseElevationFt: 820, liftCount: 10 },
    features: { snowmakingPercent: 100 },
    links: {
      website: 'https://www.skibutternut.com',
      trailMaps: [
        {
          url: 'https://www.skibutternut.com/the-mountain/trails-conditions/trail-map-videos',
          kind: 'page',
          license: 'link-only',
        },
      ],
    },
    description: 'Ski area in Great Barrington in the southern Berkshires.',
    meta: { lastVerified: RETRIEVED, sources: [wiki('Ski_Butternut')] },
  },
  {
    id: 'bousquet',
    name: 'Bousquet Mountain',
    location: { state: 'MA', town: 'Pittsfield', lat: 42.4171, lng: -73.2788 },
    stats: {
      trailCount: 24,
      skiableAcres: 200,
      verticalFt: 750,
      summitElevationFt: 1818,
      baseElevationFt: 1068,
      liftCount: 4,
    },
    features: { nightSkiing: true, snowmakingPercent: 85 },
    links: {
      website: 'https://www.bousquetmountain.com',
      trailMaps: [
        { url: 'https://bousquetmountain.com/wp-content/uploads/2025/10/Trail-Map-1.pdf', kind: 'pdf', license: 'link-only' },
      ],
    },
    description: 'Ski area in Pittsfield with night skiing.',
    meta: { lastVerified: RETRIEVED, sources: [wiki('Bousquet_Mountain')] },
  },
];
