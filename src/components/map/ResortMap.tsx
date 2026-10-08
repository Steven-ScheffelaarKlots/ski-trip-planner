'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import MapGL, { Layer, Marker, Popup, Source, type MapLayerMouseEvent, type MapRef } from 'react-map-gl/maplibre';
import { setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import type { FeatureCollection, Point } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE_URL, NEW_ENGLAND_BOUNDS } from '@/lib/config';
import type { LatLng, SkiResort } from '@/lib/types';

// MapLibre resolves its worker relative to import.meta.url, which breaks once bundled.
// The worker is copied to /public by `npm run copy-map-worker` (predev/prebuild).
setWorkerUrl('/maplibre-gl-worker.mjs');

type Props = {
  resorts: SkiResort[];
  selected: SkiResort | null;
  onSelect: (id: string) => void;
  userLocation?: LatLng | null;
  /** Space covered by overlays (details panel / bottom sheet) so fly-to centers in the visible area. */
  focusPadding?: { right?: number; bottom?: number };
};

type ResortFeatureProps = { id: string; name: string };
type Hover = { name: string; lng: number; lat: number };

const SOURCE_ID = 'resorts';
const ACCENT = '#1d4ed8';
const SELECTED = '#f97316';

export default function ResortMap({ resorts, selected, onSelect, userLocation, focusPadding }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const data = useMemo<FeatureCollection<Point, ResortFeatureProps>>(
    () => ({
      type: 'FeatureCollection',
      features: resorts.map((r) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.location.lng, r.location.lat] },
        properties: { id: r.id, name: r.name },
      })),
    }),
    [resorts],
  );

  const padRight = focusPadding?.right ?? 0;
  const padBottom = focusPadding?.bottom ?? 0;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;
    map.flyTo({
      center: [selected.location.lng, selected.location.lat],
      zoom: Math.max(map.getZoom(), 9),
      padding: { top: 0, left: 0, right: padRight, bottom: padBottom },
      duration: 800,
    });
  }, [selected, padRight, padBottom]);

  const handleClick = async (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) return;
    const [lng, lat] = (feature.geometry as Point).coordinates;
    if (feature.layer.id === 'clusters') {
      const source = mapRef.current?.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      if (!source) return;
      const zoom = await source.getClusterExpansionZoom(feature.properties.cluster_id as number);
      mapRef.current?.easeTo({ center: [lng, lat], zoom });
      return;
    }
    onSelect(feature.properties.id as string);
  };

  const handleMouseMove = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature || feature.layer.id !== 'points') {
      setHover(null);
      return;
    }
    const [lng, lat] = (feature.geometry as Point).coordinates;
    const name = feature.properties.name as string;
    setHover((h) => (h?.name === name ? h : { name, lng, lat }));
  };

  return (
    <div className="relative h-full w-full">
      <MapGL
        ref={mapRef}
        initialViewState={{
          bounds: [
            [NEW_ENGLAND_BOUNDS.west, NEW_ENGLAND_BOUNDS.south],
            [NEW_ENGLAND_BOUNDS.east, NEW_ENGLAND_BOUNDS.north],
          ],
          fitBoundsOptions: { padding: 24 },
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE_URL}
        interactiveLayerIds={['clusters', 'points']}
        cursor={hover ? 'pointer' : undefined}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!loaded) setFailed(true);
        }}
      >
        <Source id={SOURCE_ID} type="geojson" data={data} cluster clusterMaxZoom={8} clusterRadius={40}>
          <Layer
            id="clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': ACCENT,
              'circle-opacity': 0.85,
              'circle-radius': ['step', ['get', 'point_count'], 16, 5, 20, 15, 26],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{ 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 13 }}
            paint={{ 'text-color': '#ffffff' }}
          />
          <Layer
            id="points"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{ 'circle-color': ACCENT, 'circle-radius': 7, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' }}
          />
          <Layer
            id="selected-point"
            type="circle"
            filter={['==', ['get', 'id'], selected?.id ?? '']}
            paint={{ 'circle-color': SELECTED, 'circle-radius': 10, 'circle-stroke-width': 3, 'circle-stroke-color': '#ffffff' }}
          />
          <Layer
            id="point-labels"
            type="symbol"
            minzoom={9}
            filter={['!', ['has', 'point_count']]}
            layout={{
              'text-field': ['get', 'name'],
              'text-font': ['Noto Sans Regular'],
              'text-size': 12,
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
            }}
            paint={{ 'text-color': '#0f172a', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 }}
          />
        </Source>

        {hover && (
          <Popup longitude={hover.lng} latitude={hover.lat} closeButton={false} closeOnClick={false} anchor="bottom" offset={12}>
            <span className="text-sm font-medium">{hover.name}</span>
          </Popup>
        )}

        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
            <div aria-label="Your location" className="size-4 rounded-full border-2 border-white bg-sky-500 shadow-md" />
          </Marker>
        )}
      </MapGL>

      {failed && (
        <div className="absolute inset-x-3 top-3 rounded-md bg-background/95 p-3 text-sm shadow">
          The map couldn&apos;t load. The resort list and filters still work.
        </div>
      )}
    </div>
  );
}
