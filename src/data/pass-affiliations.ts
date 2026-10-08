import type { PassAffiliation, SourceRef } from '@/lib/types';

const IKON_2627: SourceRef = {
  label: 'Ikon Pass 2026-27 destinations',
  url: 'https://www.ikonpass.com/en/shop-passes/ikon-pass',
  retrievedAt: '2026-10-08',
};
const EPIC_2627: SourceRef = {
  label: '2026/27 Epic Pass buyer’s guide (OnTheSnow)',
  url: 'https://www.onthesnow.com/news/a/619177/buyer-s-guide-to-the-epic-pass',
  retrievedAt: '2026-10-08',
};

export const PASS_AFFILIATIONS: PassAffiliation[] = [
  // Ikon
  { resortId: 'killington', passId: 'ikon', season: '2026-27', access: 'days', days: 7, notes: 'Shared with Pico', source: IKON_2627 },
  { resortId: 'sunday-river', passId: 'ikon', season: '2026-27', access: 'days', days: 7, source: IKON_2627 },
  // Epic
  { resortId: 'stowe', passId: 'epic', season: '2026-27', access: 'unlimited', source: EPIC_2627 },
];
