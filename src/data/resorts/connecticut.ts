import type { SkiResort, SourceRef } from '@/lib/types';

const RETRIEVED = '2026-10-08';
const wiki = (article: string): SourceRef => ({
  label: 'Wikipedia',
  url: `https://en.wikipedia.org/wiki/${article}`,
  retrievedAt: RETRIEVED,
});
const page = (label: string, url: string): SourceRef => ({ label, url, retrievedAt: RETRIEVED });

export const CONNECTICUT_RESORTS: SkiResort[] = [
  {
    id: 'mohawk-mountain',
    name: 'Mohawk Mountain',
    location: { state: 'CT', town: 'Cornwall', lat: 41.8368, lng: -73.3134 },
    stats: { trailCount: 27, skiableAcres: 112, verticalFt: 650, liftCount: 8 },
    features: { nightSkiing: true, snowmakingPercent: 99 },
    links: {
      website: 'https://www.mohawkmtn.com',
      trailMaps: [{ url: 'https://www.mohawkmtn.com/trail-map/', kind: 'page', license: 'link-only' }],
    },
    description: 'Ski area in the Litchfield Hills with night skiing.',
    meta: { lastVerified: RETRIEVED, sources: [wiki('Mohawk_Mountain_Ski_Area')] },
  },
  {
    id: 'ski-sundown',
    name: 'Ski Sundown',
    location: { state: 'CT', town: 'New Hartford', lat: 41.8841, lng: -72.9452 },
    stats: { trailCount: 17, skiableAcres: 70, verticalFt: 625, liftCount: 5 },
    terrain: { basis: 'trails', beginner: 53, intermediate: 23, advanced: 18, expert: 6 },
    features: { nightSkiing: true, snowmakingPercent: 100 },
    links: {
      website: 'https://www.skisundown.com',
      trailMaps: [
        { url: 'https://skisundown.com/plan-your-trip/trail-map-statistics/', kind: 'page', license: 'link-only' },
      ],
    },
    description: 'Ski area northwest of Hartford with night skiing.',
    meta: { lastVerified: RETRIEVED, sources: [wiki('Ski_Sundown')] },
  },
  {
    id: 'powder-ridge',
    name: 'Powder Ridge',
    location: { state: 'CT', town: 'Middlefield', lat: 41.5023, lng: -72.7385 },
    stats: {
      trailCount: 17,
      skiableAcres: 80,
      verticalFt: 550,
      summitElevationFt: 720,
      baseElevationFt: 170,
      liftCount: 8,
    },
    terrain: { basis: 'trails', beginner: 45, intermediate: 40, advanced: 15 },
    features: { nightSkiing: true },
    links: {
      website: 'https://powderridgepark.com',
      trailMaps: [{ url: 'https://powderridgepark.com/trail-map/', kind: 'page', license: 'link-only' }],
    },
    description: 'Ski area in central Connecticut with night skiing.',
    meta: {
      lastVerified: RETRIEVED,
      sources: [
        page('Indy Pass: Powder Ridge', 'https://indyskipass.com/our-resorts/powder-ridge-0'),
        page('OpenStreetMap (coordinates)', 'https://nominatim.openstreetmap.org/search?q=Powder+Ridge,+Middlefield,+Connecticut'),
      ],
    },
  },
];
