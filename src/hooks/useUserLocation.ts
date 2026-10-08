import { useCallback, useState } from 'react';
import { loadZipTable, resolveZip } from '@/lib/geo/geocode';
import { LOCATION_STORAGE_KEY, parseStoredLocation, type UserLocation } from '@/lib/geo/stored-location';

function readStored(): UserLocation | null {
  try {
    return parseStoredLocation(localStorage.getItem(LOCATION_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStored(location: UserLocation | null) {
  try {
    if (location) localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    else localStorage.removeItem(LOCATION_STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode, blocked): location just won't persist.
  }
}

const GEO_ERRORS: Record<number, string> = {
  1: 'Location permission was denied. Enter a ZIP code instead.',
};
const GEO_FALLBACK_ERROR = "Couldn't get your location. Enter a ZIP code instead.";

/** Safe to read storage in the initializer: the explorer is client-only (ssr: false). */
export function useUserLocation() {
  const [location, setLocationState] = useState<UserLocation | null>(readStored);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const setLocation = useCallback((next: UserLocation | null) => {
    setLocationState(next);
    writeStored(next);
  }, []);

  const setFromZip = useCallback(
    async (input: string) => {
      const result = resolveZip(input, await loadZipTable());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setLocation({ label: `ZIP ${result.zip}`, coords: result.coords });
    },
    [setLocation],
  );

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError("Your browser doesn't support location. Enter a ZIP code instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setError(null);
        setLocation({ label: 'Your location', coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
      },
      (err) => {
        setLocating(false);
        setError(GEO_ERRORS[err.code] ?? GEO_FALLBACK_ERROR);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  }, [setLocation]);

  const clear = useCallback(() => {
    setError(null);
    setLocation(null);
  }, [setLocation]);

  return { location, error, locating, setFromZip, locate, clear };
}
