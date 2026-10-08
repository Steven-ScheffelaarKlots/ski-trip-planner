import { describe, expect, it } from 'vitest';
import { affiliationsFor, buildPassIndex, sizeClass } from '@/lib/resort';
import { makeResort } from '@/lib/test-fixtures';
import type { PassAffiliation } from '@/lib/types';

const src = { label: 's', url: 'https://example.com', retrievedAt: '2026-10-08' };

describe('sizeClass', () => {
  it('classifies by vertical drop', () => {
    expect(sizeClass(makeResort({ stats: { verticalFt: 999 } }))).toBe('small');
    expect(sizeClass(makeResort({ stats: { verticalFt: 1000 } }))).toBe('medium');
    expect(sizeClass(makeResort({ stats: { verticalFt: 1999 } }))).toBe('medium');
    expect(sizeClass(makeResort({ stats: { verticalFt: 2000 } }))).toBe('large');
  });

  it('is undefined without a vertical', () => {
    expect(sizeClass(makeResort())).toBeUndefined();
  });
});

describe('pass index', () => {
  const affiliations: PassAffiliation[] = [
    { resortId: 'a', passId: 'ikon', season: '2026-27', access: 'unlimited', source: src },
    { resortId: 'a', passId: 'indy', season: '2026-27', access: 'days', days: 2, source: src },
    { resortId: 'b', passId: 'epic', season: '2025-26', access: 'unlimited', source: src },
  ];

  it('groups pass ids by resort for the season', () => {
    const index = buildPassIndex(affiliations, '2026-27');
    expect(index.get('a')).toEqual(['ikon', 'indy']);
  });

  it('buildPassIndex ignores other seasons', () => {
    const index = buildPassIndex(affiliations, '2026-27');
    expect(index.has('b')).toBe(false);
  });

  it('affiliationsFor returns only that resort and season', () => {
    expect(affiliationsFor('a', affiliations, '2026-27').map((a) => a.passId)).toEqual(['ikon', 'indy']);
    expect(affiliationsFor('b', affiliations, '2026-27')).toEqual([]);
  });
});
