import type { TerrainBreakdown } from '@/lib/types';

const SEGMENTS = [
  { key: 'beginner', label: 'Beginner', className: 'bg-green-600' },
  { key: 'intermediate', label: 'Intermediate', className: 'bg-blue-600' },
  { key: 'advanced', label: 'Advanced', className: 'bg-neutral-800' },
  { key: 'expert', label: 'Expert', className: 'bg-neutral-950 ring-1 ring-inset ring-amber-400' },
] as const;

export function TerrainBar({ terrain }: { terrain: TerrainBreakdown }) {
  const segments = SEGMENTS.filter((s) => terrain[s.key] !== undefined);
  if (segments.length === 0) return null;

  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {segments.map((s) => (
          <div key={s.key} className={s.className} style={{ width: `${terrain[s.key]}%` }} />
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${s.className}`} />
            {s.label} {terrain[s.key]}%
          </li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-muted-foreground">
        % of {terrain.basis === 'trails' ? 'trails' : 'skiable acreage'}
        {terrain.expert === undefined && terrain.advanced !== undefined ? ' · advanced includes all black terrain' : ''}
      </p>
    </div>
  );
}
