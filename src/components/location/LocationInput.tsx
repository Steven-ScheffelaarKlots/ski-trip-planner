'use client';

import { LocateFixed, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { UserLocation } from '@/lib/geo/stored-location';

type Props = {
  location: UserLocation | null;
  error: string | null;
  locating: boolean;
  onZip: (zip: string) => void;
  onLocate: () => void;
  onClear: () => void;
};

export function LocationInput({ location, error, locating, onZip, onLocate, onClear }: Props) {
  const [zip, setZip] = useState('');

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold">Starting from</h2>
      {location ? (
        <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4 text-sky-600" />
            {location.label}
          </span>
          <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear location">
            <X />
          </Button>
        </div>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onZip(zip);
          }}
        >
          <Input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="ZIP code"
            inputMode="numeric"
            autoComplete="postal-code"
            aria-label="ZIP code"
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            Set
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={onLocate} disabled={locating} aria-label="Use my location">
            <LocateFixed className={locating ? 'animate-pulse' : undefined} />
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      {location && <p className="text-xs text-muted-foreground">Distances are straight-line, not driving.</p>}
    </div>
  );
}
