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
  days('loon', 'ikon', 7, IKON),
  days('sugarloaf', 'ikon', 7, IKON),
  days('cranmore', 'ikon', 2, IKON, 'Bonus mountain'),
  days('jiminy-peak', 'ikon', 2, IKON, 'Bonus mountain'),
  days('butternut', 'ikon', 2, IKON, 'Bonus mountain'),

  // Epic Pass
  unlimited('stowe', 'epic', EPIC),
  unlimited('okemo', 'epic', EPIC),
  unlimited('mount-snow', 'epic', EPIC),
  unlimited('wildcat', 'epic', EPIC),
  unlimited('attitash', 'epic', EPIC),
  unlimited('mount-sunapee', 'epic', EPIC),
  unlimited('crotched', 'epic', EPIC),

  // Indy Pass
  days('bolton-valley', 'indy', 2, INDY, INDY_NOTES),
  days('burke', 'indy', 2, INDY, INDY_NOTES),
  days('jay-peak', 'indy', 2, INDY, INDY_NOTES),
  days('magic-mountain', 'indy', 2, INDY, INDY_NOTES),
  days('middlebury-snow-bowl', 'indy', 2, INDY, INDY_NOTES),
  days('saskadena-six', 'indy', 2, INDY, INDY_NOTES),
  days('smugglers-notch', 'indy', 2, INDY_2627_ADDITIONS, INDY_NOTES),
  days('black-mountain-nh', 'indy', 2, INDY, INDY_NOTES),
  days('cannon', 'indy', 2, INDY, INDY_NOTES),
  days('dartmouth-skiway', 'indy', 2, INDY, INDY_NOTES),
  days('pats-peak', 'indy', 2, INDY, INDY_NOTES),
  days('ragged-mountain', 'indy', 2, INDY, INDY_NOTES),
  days('tenney', 'indy', 2, INDY, INDY_NOTES),
  days('waterville-valley', 'indy', 2, INDY, INDY_NOTES),
  days('whaleback', 'indy', 2, INDY, INDY_NOTES),
  days('saddleback', 'indy', 2, INDY, INDY_NOTES),
  days('mount-abram', 'indy', 2, INDY, INDY_NOTES),
  days('black-mountain-me', 'indy', 2, INDY, INDY_NOTES),
  days('big-moose', 'indy', 2, INDY, INDY_NOTES),
  days('camden-snow-bowl', 'indy', 2, INDY, INDY_NOTES),
  days('berkshire-east', 'indy', 2, INDY, INDY_NOTES),
  days('bousquet', 'indy', 2, INDY, INDY_NOTES),
  days('catamount', 'indy', 2, INDY, INDY_NOTES),
  days('mohawk-mountain', 'indy', 2, INDY, INDY_NOTES),
  days('powder-ridge', 'indy', 2, INDY_2627_ADDITIONS, INDY_NOTES),
];
