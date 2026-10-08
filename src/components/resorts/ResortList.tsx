import { Button } from '@/components/ui/button';
import { ResortCard } from '@/components/resorts/ResortCard';
import { SORT_LABELS, type SortKey } from '@/lib/sort';
import type { PassId, SkiResort, TravelEstimate } from '@/lib/types';

type Props = {
  resorts: SkiResort[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  travel: ReadonlyMap<string, TravelEstimate>;
  passIndex: ReadonlyMap<string, PassId[]>;
  passNames: ReadonlyMap<string, string>;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
  onClearFilters: () => void;
};

const SORT_KEYS = Object.keys(SORT_LABELS) as SortKey[];

export function ResortList({
  resorts,
  selectedId,
  onSelect,
  travel,
  passIndex,
  passNames,
  sortKey,
  onSortChange,
  onClearFilters,
}: Props) {
  const hasLocation = travel.size > 0;
  const effectiveSort = sortKey === 'distance' && !hasLocation ? 'name' : sortKey;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {resorts.length} {resorts.length === 1 ? 'resort' : 'resorts'}
        </h2>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Sort
          <select
            value={effectiveSort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="rounded-md border bg-background px-2 py-1 text-xs text-foreground"
          >
            {SORT_KEYS.map((key) => (
              <option key={key} value={key} disabled={key === 'distance' && !hasLocation}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {resorts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          <p>No resorts match these filters.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onClearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {resorts.map((r) => (
            <li key={r.id}>
              <ResortCard
                resort={r}
                selected={r.id === selectedId}
                onSelect={onSelect}
                travel={travel.get(r.id)}
                passIds={passIndex.get(r.id) ?? []}
                passNames={passNames}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
