import { describe, expect, it } from 'vitest';
import { RESORTS } from '@/data/resorts';
import { PASSES } from '@/data/passes';
import { PASS_AFFILIATIONS } from '@/data/pass-affiliations';
import { RATINGS } from '@/data/ratings';
import { MIN_VERTICAL_FT, NEW_ENGLAND_BOUNDS } from '@/lib/config';
import type { SourceRef } from '@/lib/types';

const isHttps = (url: string) => {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
};
const isIsoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const validSource = (s: SourceRef) => s.label.length > 0 && isHttps(s.url) && isIsoDate(s.retrievedAt);

describe('resorts', () => {
  it('has at least one resort', () => {
    expect(RESORTS.length).toBeGreaterThan(0);
  });

  it('has unique kebab-case ids', () => {
    const ids = RESORTS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(RESORTS.map((r) => [r.id, r] as const))('%s has valid location, stats, terrain, links, meta', (_id, r) => {
    const { lat, lng } = r.location;
    expect(lat).toBeGreaterThanOrEqual(NEW_ENGLAND_BOUNDS.south);
    expect(lat).toBeLessThanOrEqual(NEW_ENGLAND_BOUNDS.north);
    expect(lng).toBeGreaterThanOrEqual(NEW_ENGLAND_BOUNDS.west);
    expect(lng).toBeLessThanOrEqual(NEW_ENGLAND_BOUNDS.east);

    for (const value of Object.values(r.stats)) {
      expect(Number.isFinite(value) && value > 0).toBe(true);
    }
    if (r.stats.verticalFt !== undefined) expect(r.stats.verticalFt).toBeGreaterThanOrEqual(MIN_VERTICAL_FT);
    if (r.stats.summitElevationFt !== undefined && r.stats.baseElevationFt !== undefined) {
      expect(r.stats.summitElevationFt).toBeGreaterThan(r.stats.baseElevationFt);
    }

    if (r.terrain) {
      const { beginner, intermediate, advanced, expert } = r.terrain;
      const reported = [beginner, intermediate, advanced, expert].filter((v): v is number => v !== undefined);
      for (const v of reported) expect(v >= 0 && v <= 100).toBe(true);
      if (beginner !== undefined && intermediate !== undefined && advanced !== undefined) {
        const sum = reported.reduce((a, b) => a + b, 0);
        expect(sum).toBeGreaterThanOrEqual(95);
        expect(sum).toBeLessThanOrEqual(105);
      }
    }

    if (r.features.snowmakingPercent !== undefined) {
      expect(r.features.snowmakingPercent >= 0 && r.features.snowmakingPercent <= 100).toBe(true);
    }

    if (r.links.website) expect(isHttps(r.links.website)).toBe(true);
    for (const map of r.links.trailMaps ?? []) {
      expect(isHttps(map.url)).toBe(true);
      expect(map.license).toBe('link-only');
    }

    expect(isIsoDate(r.meta.lastVerified)).toBe(true);
    expect(r.meta.sources.length).toBeGreaterThan(0);
    for (const s of r.meta.sources) expect(validSource(s)).toBe(true);
  });
});

describe('passes and affiliations', () => {
  const resortIds = new Set(RESORTS.map((r) => r.id));
  const passIds = new Set(PASSES.map((p) => p.id));

  it('has unique pass ids with https websites', () => {
    expect(passIds.size).toBe(PASSES.length);
    for (const p of PASSES) expect(isHttps(p.website)).toBe(true);
  });

  it('references existing resorts and passes, with valid season and access', () => {
    for (const a of PASS_AFFILIATIONS) {
      expect(resortIds.has(a.resortId), `unknown resort ${a.resortId}`).toBe(true);
      expect(passIds.has(a.passId), `unknown pass ${a.passId}`).toBe(true);
      expect(a.season).toMatch(/^\d{4}-\d{2}$/);
      if (a.access === 'days') expect(a.days).toBeGreaterThan(0);
      else expect(a.days).toBeUndefined();
      expect(validSource(a.source)).toBe(true);
    }
  });

  it('has no duplicate resort/pass/season entries', () => {
    const keys = PASS_AFFILIATIONS.map((a) => `${a.resortId}|${a.passId}|${a.season}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('ratings', () => {
  const resortIds = new Set(RESORTS.map((r) => r.id));

  it('every rating is in range, references a resort, and has sources', () => {
    for (const r of RATINGS) {
      expect(resortIds.has(r.resortId)).toBe(true);
      expect(r.value >= 1 && r.value <= 5).toBe(true);
      expect(r.sources.length).toBeGreaterThan(0);
      for (const s of r.sources) expect(validSource(s)).toBe(true);
      expect(isIsoDate(r.asOf)).toBe(true);
    }
  });
});
