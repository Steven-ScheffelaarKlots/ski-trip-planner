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
