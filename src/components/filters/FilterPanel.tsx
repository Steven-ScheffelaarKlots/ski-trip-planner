'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { isFilterActive } from '@/lib/filters/apply';
import type {
  FilterDefinition,
  FilterState,
  FilterValue,
  MultiFilterDef,
  RangeFilterDef,
  ToggleFilterDef,
} from '@/lib/filters/types';
import { formatNumber } from '@/lib/format';

type Props = {
  defs: FilterDefinition[];
  state: FilterState;
  onChange: (id: string, value: FilterValue | undefined) => void;
  onClear: () => void;
  activeCount: number;
  hasLocation: boolean;
};

function rangeSummary(def: RangeFilterDef, value: FilterValue | undefined): string {
  if (!isFilterActive(def, value)) return 'Any';
  const [lo, hi] = value as [number, number];
  const hiText = hi >= def.max ? `${formatNumber(def.max)}+` : formatNumber(hi);
  if (def.mode === 'max') return `Up to ${hiText} ${def.unit}`;
  return `${formatNumber(lo)}–${hiText} ${def.unit}`;
}

function RangeControl({ def, value, onChange, disabled }: {
  def: RangeFilterDef;
  value: FilterValue | undefined;
  onChange: (v: [number, number]) => void;
  disabled: boolean;
}) {
  const [lo, hi] = (Array.isArray(value) && typeof value[0] === 'number' ? value : [def.min, def.max]) as [number, number];
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{def.label}</span>
        <span className="text-xs text-muted-foreground">{rangeSummary(def, value)}</span>
      </div>
      <Slider
        min={def.min}
        max={def.max}
        step={def.step}
        disabled={disabled}
        value={def.mode === 'max' ? [hi] : [lo, hi]}
        onValueChange={(v) => onChange(def.mode === 'max' ? [def.min, v[0]] : [v[0], v[1]])}
        aria-label={def.label}
      />
      {disabled ? (
        <p className="mt-1 text-xs text-muted-foreground">Set your location to filter by distance.</p>
      ) : (
        def.description && <p className="mt-1 text-xs text-muted-foreground">{def.description}</p>
      )}
    </div>
  );
}

function MultiControl({ def, value, onChange }: {
  def: MultiFilterDef;
  value: FilterValue | undefined;
  onChange: (v: string[]) => void;
}) {
  const selected = Array.isArray(value) && typeof value[0] !== 'number' ? (value as string[]) : [];
  const toggle = (option: string) =>
    onChange(selected.includes(option) ? selected.filter((v) => v !== option) : [...selected, option]);

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{def.label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {def.options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o.value)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                on ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {def.description && <p className="mt-1 text-xs text-muted-foreground">{def.description}</p>}
    </fieldset>
  );
}

function ToggleControl({ def, value, onChange }: {
  def: ToggleFilterDef;
  value: FilterValue | undefined;
  onChange: (v: boolean) => void;
}) {
  const id = `filter-${def.id}`;
  return (
    <div className="flex items-start gap-2">
      <Checkbox id={id} checked={value === true} onCheckedChange={(c) => onChange(c === true)} className="mt-0.5" />
      <label htmlFor={id} className="text-sm">
        <span className="font-medium">{def.label}</span>
        {def.description && <span className="block text-xs text-muted-foreground">{def.description}</span>}
      </label>
    </div>
  );
}

export function FilterPanel({ defs, state, onChange, onClear, activeCount, hasLocation }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters{activeCount > 0 ? ` (${activeCount})` : ''}</h2>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={activeCount === 0}>
          Clear all
        </Button>
      </div>
      {defs.map((def) => {
        const value = state[def.id];
        switch (def.control) {
          case 'range':
            return (
              <RangeControl
                key={def.id}
                def={def}
                value={value}
                onChange={(v) => onChange(def.id, v)}
                disabled={def.requiresLocation === true && !hasLocation}
              />
            );
          case 'multi':
            return <MultiControl key={def.id} def={def} value={value} onChange={(v) => onChange(def.id, v)} />;
          case 'toggle':
            return <ToggleControl key={def.id} def={def} value={value} onChange={(v) => onChange(def.id, v)} />;
        }
      })}
    </div>
  );
}
