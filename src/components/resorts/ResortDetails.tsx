import { ExternalLink, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TerrainBar } from '@/components/resorts/TerrainBar';
import { formatCoords, formatMiles, passAccessLabel, withUnit, yesNo } from '@/lib/format';
import { RATING_LABELS, SIZE_LABELS, STATE_NAMES, sizeClass } from '@/lib/resort';
import type { PassAffiliation, ResortRating, SkiResort, TravelEstimate } from '@/lib/types';

type Props = {
  resort: SkiResort;
  affiliations: PassAffiliation[];
  passNames: ReadonlyMap<string, string>;
  ratings: ResortRating[];
  travel?: TravelEstimate;
  onClose: () => void;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t py-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

const TRAIL_MAP_KIND_LABEL = { page: '', pdf: ' (PDF)', image: ' (image)' } as const;

export function ResortDetails({ resort, affiliations, passNames, ratings, travel, onClose }: Props) {
  const { stats, features, location } = resort;
  const size = sizeClass(resort);

  return (
    <article className="text-sm">
      <header className="flex items-start justify-between gap-2 pb-3">
        <div>
          <h2 className="text-lg font-semibold leading-tight">{resort.name}</h2>
          {resort.formerNames?.length ? (
            <p className="text-xs text-muted-foreground">Formerly {resort.formerNames.join(', ')}</p>
          ) : null}
          <p className="text-muted-foreground">
            {[location.town, STATE_NAMES[location.state]].filter(Boolean).join(', ')}
          </p>
          {travel && (
            <p className="mt-1 font-medium">
              {formatMiles(travel.miles)} <span className="font-normal text-muted-foreground">(straight-line)</span>
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details">
          <X />
        </Button>
      </header>

      {resort.description && <p className="pb-4">{resort.description}</p>}

      <Section title="Mountain">
        <dl className="grid grid-cols-2 gap-3">
          <Stat label="Vertical drop" value={withUnit(stats.verticalFt, 'ft')} />
          <Stat label="Size" value={size ? SIZE_LABELS[size] : '—'} />
          <Stat label="Trails" value={withUnit(stats.trailCount, '')} />
          <Stat label="Skiable acres" value={withUnit(stats.skiableAcres, '')} />
          <Stat label="Summit elevation" value={withUnit(stats.summitElevationFt, 'ft')} />
          <Stat label="Base elevation" value={withUnit(stats.baseElevationFt, 'ft')} />
          <Stat label="Lifts" value={withUnit(stats.liftCount, '')} />
          <Stat label="Coordinates" value={formatCoords(location)} />
        </dl>
      </Section>

      {resort.terrain && (
        <Section title="Terrain">
          <TerrainBar terrain={resort.terrain} />
        </Section>
      )}

      <Section title="Features">
        <dl className="grid grid-cols-2 gap-3">
          <Stat label="Night skiing" value={yesNo(features.nightSkiing)} />
          <Stat label="Terrain park" value={yesNo(features.terrainPark)} />
          <Stat
            label="Snowmaking"
            value={features.snowmakingPercent === undefined ? '—' : `${features.snowmakingPercent}%`}
          />
        </dl>
      </Section>

      <Section title={`Passes (${affiliations[0]?.season ?? 'current season'})`}>
        {affiliations.length === 0 ? (
          <p className="text-muted-foreground">Not on any tracked pass.</p>
        ) : (
          <ul className="space-y-1.5">
            {affiliations.map((a) => (
              <li key={a.passId} className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{passNames.get(a.passId) ?? a.passId}</Badge>
                <span>{passAccessLabel(a)}</span>
                {a.notes && <span className="text-muted-foreground">· {a.notes}</span>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Links">
        <ul className="space-y-1.5">
          {resort.links.website && (
            <li>
              <a className="inline-flex items-center gap-1 text-blue-700 hover:underline" href={resort.links.website} target="_blank" rel="noopener noreferrer">
                Official website <ExternalLink className="size-3.5" />
              </a>
            </li>
          )}
          {resort.links.trailMaps?.map((m) => (
            <li key={m.url}>
              <a className="inline-flex items-center gap-1 text-blue-700 hover:underline" href={m.url} target="_blank" rel="noopener noreferrer">
                Official trail map{TRAIL_MAP_KIND_LABEL[m.kind]} <ExternalLink className="size-3.5" />
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Community ratings">
        {ratings.length === 0 ? (
          <p className="text-muted-foreground">
            No community ratings yet. Subjective ratings will only appear here alongside their sources.
          </p>
        ) : (
          <ul className="space-y-2">
            {ratings.map((r) => (
              <li key={r.attribute}>
                <span className="font-medium">{RATING_LABELS[r.attribute]}:</span> {r.value}/5{' '}
                <span className="text-muted-foreground">
                  ({r.method}, as of {r.asOf}) ·{' '}
                  {r.sources.map((s, i) => (
                    <a key={s.url} className="text-blue-700 hover:underline" href={s.url} target="_blank" rel="noopener noreferrer">
                      {i > 0 ? ', ' : ''}
                      {s.label}
                    </a>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <footer className="border-t pt-3 text-xs text-muted-foreground">
        Data last verified {resort.meta.lastVerified}. Sources:{' '}
        {resort.meta.sources.map((s, i) => (
          <a key={s.url} className="hover:underline" href={s.url} target="_blank" rel="noopener noreferrer">
            {i > 0 ? ', ' : ''}
            {s.label}
          </a>
        ))}
      </footer>
    </article>
  );
}
