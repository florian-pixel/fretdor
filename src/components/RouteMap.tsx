'use client';
import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
} as const;

type SurfaceType = 'goudron' | 'piste_praticable' | 'piste_degradee';

interface RouteSegment {
  surface: SurfaceType;
  coordinates: [number, number][];
}

const SURFACE_COLORS: Record<SurfaceType, string> = {
  goudron: '#16a34a',
  piste_praticable: '#f97316',
  piste_degradee: '#dc2626',
};

interface RouteMapProps {
  onPointsSelected: (depart: [number, number], arrivee: [number, number]) => void;
  routeSegments?: RouteSegment[] | null;
  height?: string;
}

export function RouteMap({ onPointsSelected, routeSegments, height = '500px' }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const pointsRef = useRef<[number, number][]>([]);
  const [pointsCount, setPointsCount] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: OSM_STYLE as any,
      center: [-4.0083, 5.3599],
      zoom: 11,
    });
    mapRef.current = map;
    map.on('load', () => setMapLoaded(true));

    map.on('click', (e) => {
      const point: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      if (pointsRef.current.length >= 2) {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        pointsRef.current = [];
        clearRouteLayers(map);
      }

      const color = pointsRef.current.length === 0 ? '#16a34a' : '#1d4ed8';
      const marker = new maplibregl.Marker({ color }).setLngLat(point).addTo(map);
      markersRef.current.push(marker);
      pointsRef.current.push(point);
      setPointsCount(pointsRef.current.length);

      if (pointsRef.current.length === 2) {
        onPointsSelected(pointsRef.current[0], pointsRef.current[1]);
      }
    });

    return () => map.remove();
  }, [onPointsSelected]);

  // Dessine les segments colorés dès qu'ils arrivent
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    clearRouteLayers(map);
    if (!routeSegments || routeSegments.length === 0) return;

    const geojson = {
      type: 'FeatureCollection' as const,
      features: routeSegments.map((seg, i) => ({
        type: 'Feature' as const,
        properties: { surface: seg.surface },
        geometry: { type: 'LineString' as const, coordinates: seg.coordinates },
        id: i,
      })),
    };

    map.addSource('route-segments', { type: 'geojson', data: geojson });
    map.addLayer({
      id: 'route-segments-layer',
      type: 'line',
      source: 'route-segments',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-width': 4,
        'line-color': [
          'match',
          ['get', 'surface'],
          'goudron', SURFACE_COLORS.goudron,
          'piste_praticable', SURFACE_COLORS.piste_praticable,
          'piste_degradee', SURFACE_COLORS.piste_degradee,
          '#64748b',
        ],
      },
    });

    // cadrer la vue sur le trajet
    const allCoords = routeSegments.flatMap((s) => s.coordinates);
    if (allCoords.length > 0) {
      const bounds = allCoords.reduce(
        (b, c) => b.extend(c as [number, number]),
        new maplibregl.LngLatBounds(allCoords[0] as [number, number], allCoords[0] as [number, number])
      );
      map.fitBounds(bounds, { padding: 40, duration: 500 });
    }
  }, [routeSegments, mapLoaded]);

  const clearRouteLayers = (map: maplibregl.Map) => {
    if (map.getLayer('route-segments-layer')) map.removeLayer('route-segments-layer');
    if (map.getSource('route-segments')) map.removeSource('route-segments');
  };

  const handleReset = () => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    pointsRef.current = [];
    setPointsCount(0);
    if (mapRef.current) clearRouteLayers(mapRef.current);
  };

  return (
    <div className="relative">
      <div ref={mapContainer} style={{ height }} className="w-full" />
      {pointsCount > 0 && (
        <button
          type="button"
          onClick={handleReset}
          className="absolute top-2 right-2 z-10 bg-white text-xs font-medium text-slate-600 px-2.5 py-1.5 rounded-md shadow border border-slate-200 hover:bg-slate-50"
        >
          Réinitialiser
        </button>
      )}
      {routeSegments && routeSegments.length > 0 && (
        <div className="absolute bottom-2 left-2 z-10 bg-white/90 backdrop-blur text-[11px] px-2 py-1.5 rounded-md shadow border border-slate-200 flex gap-3">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: SURFACE_COLORS.goudron }} />Goudron</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: SURFACE_COLORS.piste_praticable }} />Piste praticable</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: SURFACE_COLORS.piste_degradee }} />Piste dégradée</span>
        </div>
      )}
    </div>
  );
}