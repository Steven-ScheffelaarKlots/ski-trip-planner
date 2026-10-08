import { Badge } from '@/components/ui/badge';
import { formatMiles, withUnit } from '@/lib/format';
import type { PassId, SkiResort, TravelEstimate } from '@/lib/types';

type Props = {
  resort: SkiResort;
  selected: boolean;
  onSelect: (id: string) => void;
  travel?: TravelEstimate;
  passIds: PassId[];
  passNames: ReadonlyMap<string, string>;
};

export function ResortCard({ resort, selected, onSelect, travel, passIds, passNames }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(resort.id)}
      aria-current={selected}
      className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 ${
        selected ? 'border-orange-500 bg-orange-50' : ''
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{resort.name}</span>
        {travel && <span className="shrink-0 text-xs text-muted-foreground">{formatMiles(travel.miles)}</span>}
      </div>
      <div className="text-xs text-muted-foreground">
        {resort.location.state} · {withUnit(resort.stats.verticalFt, 'ft vert')} · {withUnit(resort.stats.trailCount, 'trails')}
      </div>
      {passIds.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {passIds.map((id) => (
            <Badge key={id} variant="secondary" className="text-[10px]">
              {passNames.get(id) ?? id}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );
}
