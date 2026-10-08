'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { MobileSheet, SNAP_POINTS, type SnapPoint } from '@/components/layout/MobileSheet';
import { LocationInput } from '@/components/location/LocationInput';
import ResortMap from '@/components/map/ResortMap';
import { ResortDetails } from '@/components/resorts/ResortDetails';
import { ResortList } from '@/components/resorts/ResortList';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PASS_AFFILIATIONS } from '@/data/pass-affiliations';
import { PASSES } from '@/data/passes';
import { RATINGS } from '@/data/ratings';
import { RESORTS } from '@/data/resorts';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useResortFilters } from '@/hooks/useResortFilters';
import { useTravelEstimates } from '@/hooks/useTravelEstimates';
import { useUserLocation } from '@/hooks/useUserLocation';
import { CURRENT_SEASON } from '@/lib/config';
import { applyFilters } from '@/lib/filters/apply';
import { buildFilters } from '@/lib/filters/definitions';
import type { FilterContext } from '@/lib/filters/types';
import { travelNote } from '@/lib/format';
import { affiliationsFor, buildPassIndex } from '@/lib/resort';
import { sortResorts, type SortKey } from '@/lib/sort';

const PASS_NAMES: ReadonlyMap<string, string> = new Map(PASSES.map((p) => [p.id, p.name]));
const PASS_INDEX = buildPassIndex(PASS_AFFILIATIONS, CURRENT_SEASON);
const FILTER_DEFS = buildFilters(RESORTS, PASSES);
const DETAILS_WIDTH = 400;

export default function ResortExplorer() {
  const isDesktop = useIsDesktop();
  const filters = useResortFilters(FILTER_DEFS);
  const userLocation = useUserLocation();
  const travel = useTravelEstimates(userLocation.location, RESORTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('distance');
  const [snap, setSnap] = useState<SnapPoint>(SNAP_POINTS[0]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const ctx = useMemo<FilterContext>(() => ({ travel, passesByResort: PASS_INDEX }), [travel]);
  const filtered = useMemo(() => applyFilters(RESORTS, FILTER_DEFS, filters.state, ctx), [filters.state, ctx]);
  const sorted = useMemo(() => sortResorts(filtered, sortKey, travel), [filtered, sortKey, travel]);

  // A selection hidden by the filters closes its details.
  const selected = filtered.find((r) => r.id === selectedId) ?? null;

  const select = (id: string) => {
    setSelectedId(id);
    if (!isDesktop) setSnap(SNAP_POINTS[1]);
  };
  const closeDetails = () => setSelectedId(null);

  const locationInput = (
    <LocationInput
      location={userLocation.location}
      error={userLocation.error}
      locating={userLocation.locating}
      note={travelNote(travel)}
      onZip={userLocation.setFromZip}
      onLocate={userLocation.locate}
      onClear={userLocation.clear}
    />
  );

  const filterPanel = (
    <FilterPanel
      defs={FILTER_DEFS}
      state={filters.state}
      onChange={filters.setValue}
      onClear={filters.clear}
      activeCount={filters.activeCount}
      hasLocation={travel.size > 0}
    />
  );

  const list = (
    <ResortList
      resorts={sorted}
      selectedId={selected?.id ?? null}
      onSelect={select}
      travel={travel}
      passIndex={PASS_INDEX}
      passNames={PASS_NAMES}
      sortKey={sortKey}
      onSortChange={setSortKey}
      onClearFilters={filters.clear}
    />
  );

  const details = selected && (
    <ResortDetails
      resort={selected}
      affiliations={affiliationsFor(selected.id, PASS_AFFILIATIONS, CURRENT_SEASON)}
      passNames={PASS_NAMES}
      ratings={RATINGS.filter((r) => r.resortId === selected.id)}
      travel={travel.get(selected.id)}
      onClose={closeDetails}
    />
  );

  const map = (
    <ResortMap
      resorts={filtered}
      selected={selected}
      onSelect={select}
      userLocation={userLocation.location?.coords ?? null}
      focusPadding={
        isDesktop
          ? { right: selected ? DETAILS_WIDTH : 0 }
          : { bottom: selected ? Math.round(window.innerHeight * 0.5) : 0 }
      }
    />
  );

  if (isDesktop) {
    return (
      <div className="grid h-dvh grid-cols-[360px_1fr]">
        <aside className="space-y-6 overflow-y-auto border-r p-4">
          <h1 className="text-lg font-semibold">New England Ski Resorts</h1>
          {locationInput}
          {filterPanel}
          {list}
        </aside>
        <main className="relative">
          {map}
          {details && (
            <div
              className="absolute inset-y-3 right-3 overflow-y-auto rounded-lg bg-background p-4 shadow-lg"
              style={{ width: DETAILS_WIDTH - 24 }}
            >
              {details}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="relative h-dvh overflow-hidden">
      {map}

      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 p-3">
        <span className="rounded-full bg-background/95 px-3 py-1.5 text-xs font-medium shadow">
          {userLocation.location ? `From ${userLocation.location.label}` : 'New England Ski Resorts'}
        </span>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="shadow">
              <SlidersHorizontal />
              Filters{filters.activeCount > 0 ? ` (${filters.activeCount})` : ''}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[90vw] max-w-sm overflow-y-auto p-4">
            <SheetHeader className="p-0">
              <SheetTitle>Location &amp; filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-6">
              {locationInput}
              {filterPanel}
              <Button className="w-full" onClick={() => setFiltersOpen(false)}>
                Show {filtered.length} {filtered.length === 1 ? 'resort' : 'resorts'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <MobileSheet
        title={selected ? selected.name : `${filtered.length} ${filtered.length === 1 ? 'resort' : 'resorts'}`}
        activeSnap={snap}
        onActiveSnapChange={setSnap}
      >
        {details ?? list}
      </MobileSheet>
    </div>
  );
}
