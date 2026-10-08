import { SIZE_THRESHOLDS_FT } from '@/lib/config';
import type { PassAffiliation, PassId, RatingAttribute, SkiResort, StateCode } from '@/lib/types';

export type SizeClass = 'small' | 'medium' | 'large';

export const SIZE_LABELS: Record<SizeClass, string> = {
  small: 'Small (<1,000 ft)',
  medium: 'Medium (1,000–1,999 ft)',
  large: 'Large (2,000+ ft)',
};

export const STATE_NAMES: Record<StateCode, string> = {
  VT: 'Vermont',
  NH: 'New Hampshire',
  ME: 'Maine',
  MA: 'Massachusetts',
  CT: 'Connecticut',
  RI: 'Rhode Island',
};

export const RATING_LABELS: Record<RatingAttribute, string> = {
  beginnerFriendly: 'Beginner friendly',
  expertFriendly: 'Expert friendly',
  apres: 'Après',
  nightlife: 'Nightlife',
  familyFriendly: 'Family friendly',
  terrainVariety: 'Terrain variety',
  snowQuality: 'Snow quality',
  crowding: 'Crowding',
  atmosphere: 'Atmosphere',
};

export function sizeClass(resort: SkiResort): SizeClass | undefined {
  const vertical = resort.stats.verticalFt;
  if (vertical === undefined) return undefined;
  if (vertical >= SIZE_THRESHOLDS_FT.large) return 'large';
  if (vertical >= SIZE_THRESHOLDS_FT.medium) return 'medium';
  return 'small';
}

export function buildPassIndex(affiliations: PassAffiliation[], season: string): Map<string, PassId[]> {
  const index = new Map<string, PassId[]>();
  for (const a of affiliations) {
    if (a.season !== season) continue;
    index.set(a.resortId, [...(index.get(a.resortId) ?? []), a.passId]);
  }
  return index;
}

export function affiliationsFor(resortId: string, affiliations: PassAffiliation[], season: string): PassAffiliation[] {
  return affiliations.filter((a) => a.resortId === resortId && a.season === season);
}
