'use client';

import { useMemo, useState } from 'react';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { LocationInput } from '@/components/location/LocationInput';
import ResortMap from '@/components/map/ResortMap';
import { ResortDetails } from '@/components/resorts/ResortDetails';
import { ResortList } from '@/components/resorts/ResortList';
import { PASS_AFFILIATIONS } from '@/data/pass-affiliations';
import { PASSES } from '@/data/passes';
import { RATINGS } from '@/data/ratings';
import { RESORTS } from '@/data/resorts';
import { useResortFilters } from '@/hooks/useResortFilters';
import { useTravelEstimates } from '@/hooks/useTravelEstimates';
import { useUserLocation } from '@/hooks/useUserLocation';
import { CURRENT_SEASON } from '@/lib/config';
import { applyFilters } from '@/lib/filters/apply';
import { buildFilters } from '@/lib/filters/definitions';
import type { FilterContext } from '@/lib/filters/types';
import { affiliationsFor, buildPassIndex } from '@/lib/resort';
import { sortResorts, type SortKey } from '@/lib/sort';

const PASS_NAMES: ReadonlyMap<string, string> = new Map(PASSES.map((p) => [p.id, p.name]));
const PASS_INDEX = buildPassIndex(PASS_AFFILIATIONS, CURRENT_SEASON);
const FILTER_DEFS = buildFilters(RESORTS, PASSES);
const DETAILS_WIDTH = 400;

export default function ResortExplorer() {
  const filters = useResortFilters(FILTER_DEFS);
  const userLocation = useUserLocation();
  const travel = useTravelEstimates(userLocation.location, RESORTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('distance');

  const ctx = useMemo<FilterContext>(() => ({ travel, passesByResort: PASS_INDEX }), [travel]);
  const filtered = useMemo(() => applyFilters(RESORTS, FILTER_DEFS, filters.state, ctx), [filters.state, ctx]);
  const sorted = useMemo(() => sortResorts(filtered, sortKey, travel), [filtered, sortKey, travel]);

  // A selection hidden by the filters closes its details.
  const selected = filtered.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="grid h-dvh grid-cols-[360px_1fr]">
      <aside className="space-y-6 overflow-y-auto border-r p-4">
        <h1 className="text-lg font-semibold">New England Ski Resorts</h1>
        <LocationInput
          location={userLocation.location}
          error={userLocation.error}
          locating={userLocation.locating}
          onZip={userLocation.setFromZip}
          onLocate={userLocation.locate}
          onClear={userLocation.clear}
        />
        <FilterPanel
          defs={FILTER_DEFS}
          state={filters.state}
          onChange={filters.setValue}
          onClear={filters.clear}
          activeCount={filters.activeCount}
          hasLocation={travel.size > 0}
        />
        <ResortList
          resorts={sorted}
          selectedId={selected?.id ?? null}
          onSelect={setSelectedId}
          travel={travel}
          passIndex={PASS_INDEX}
          passNames={PASS_NAMES}
          sortKey={sortKey}
          onSortChange={setSortKey}
          onClearFilters={filters.clear}
        />
      </aside>

      <main className="relative">
        <ResortMap
          resorts={filtered}
          selected={selected}
          onSelect={setSelectedId}
          userLocation={userLocation.location?.coords ?? null}
          focusPadding={{ right: selected ? DETAILS_WIDTH : 0 }}
        />
        {selected && (
          <div
            className="absolute inset-y-3 right-3 overflow-y-auto rounded-lg bg-background p-4 shadow-lg"
            style={{ width: DETAILS_WIDTH - 24 }}
          >
            <ResortDetails
              resort={selected}
              affiliations={affiliationsFor(selected.id, PASS_AFFILIATIONS, CURRENT_SEASON)}
              passNames={PASS_NAMES}
              ratings={RATINGS.filter((r) => r.resortId === selected.id)}
              travel={travel.get(selected.id)}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
