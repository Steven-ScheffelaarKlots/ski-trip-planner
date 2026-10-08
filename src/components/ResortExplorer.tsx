'use client';

import { useState } from 'react';
import ResortMap from '@/components/map/ResortMap';
import { ResortDetails } from '@/components/resorts/ResortDetails';
import { PASS_AFFILIATIONS } from '@/data/pass-affiliations';
import { PASSES } from '@/data/passes';
import { RATINGS } from '@/data/ratings';
import { RESORTS } from '@/data/resorts';
import { CURRENT_SEASON } from '@/lib/config';
import { affiliationsFor } from '@/lib/resort';

const PASS_NAMES: ReadonlyMap<string, string> = new Map(PASSES.map((p) => [p.id, p.name]));
const DETAILS_WIDTH = 400;

export default function ResortExplorer() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = RESORTS.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="grid h-dvh grid-cols-[360px_1fr]">
      <aside className="overflow-y-auto border-r p-4">
        <h1 className="text-lg font-semibold">New England Ski Resorts</h1>
        <p className="text-sm text-muted-foreground">{RESORTS.length} resorts</p>
      </aside>

      <main className="relative">
        <ResortMap
          resorts={RESORTS}
          selected={selected}
          onSelect={setSelectedId}
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
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
