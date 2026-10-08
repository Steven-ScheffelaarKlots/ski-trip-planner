import type { PassAffiliation, PassId, SourceRef } from '@/lib/types';

const SEASON = '2026-27';
const RETRIEVED = '2026-10-08';

const IKON: SourceRef = {
  label: 'Ikon Pass 2026-27 destinations',
  url: 'https://www.ikonpass.com/en/shop-passes/ikon-pass',
  retrievedAt: RETRIEVED,
};
const EPIC: SourceRef = {
  label: '2026/27 Epic Pass buyer’s guide (OnTheSnow)',
  url: 'https://www.onthesnow.com/news/a/619177/buyer-s-guide-to-the-epic-pass',
  retrievedAt: RETRIEVED,
};
const INDY: SourceRef = { label: 'Indy Pass resorts', url: 'https://www.indyskipass.com/our-resorts', retrievedAt: RETRIEVED };
const INDY_2627_ADDITIONS: SourceRef = {
  label: 'Indy Pass 2026-27 additions',
  url: 'https://www.indyskipass.com/this-is-indy/news/indy-pass-will-add-over-50-new-resorts-surpassing-300-total-for-the-first-time-in-its-history',
  retrievedAt: RETRIEVED,
};

const INDY_NOTES = 'Blackout dates apply to the base Indy Pass (not Indy+)';

const unlimited = (resortId: string, passId: PassId, source: SourceRef): PassAffiliation => ({
  resortId,
  passId,
  season: SEASON,
  access: 'unlimited',
  source,
});
const days = (resortId: string, passId: PassId, n: number, source: SourceRef, notes?: string): PassAffiliation => ({
  resortId,
  passId,
  season: SEASON,
  access: 'days',
  days: n,
  source,
  ...(notes ? { notes } : {}),
});

export const PASS_AFFILIATIONS: PassAffiliation[] = [
  // Ikon Pass (full pass; Ikon Base access differs)
  unlimited('stratton', 'ikon', IKON),
  unlimited('sugarbush', 'ikon', IKON),
  days('killington', 'ikon', 7, IKON, 'Shared with Pico'),
  days('pico', 'ikon', 7, IKON, 'Shared with Killington'),
  days('sunday-river', 'ikon', 7, IKON),

  // Epic Pass
  unlimited('stowe', 'epic', EPIC),
  unlimited('okemo', 'epic', EPIC),
  unlimited('mount-snow', 'epic', EPIC),

  // Indy Pass
  days('bolton-valley', 'indy', 2, INDY, INDY_NOTES),
  days('burke', 'indy', 2, INDY, INDY_NOTES),
  days('jay-peak', 'indy', 2, INDY, INDY_NOTES),
  days('magic-mountain', 'indy', 2, INDY, INDY_NOTES),
  days('middlebury-snow-bowl', 'indy', 2, INDY, INDY_NOTES),
  days('smugglers-notch', 'indy', 2, INDY_2627_ADDITIONS, INDY_NOTES),
];
