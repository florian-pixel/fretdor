import { NextRequest, NextResponse } from 'next/server';

type SurfaceType = 'goudron' | 'piste_praticable' | 'piste_degradee';

interface SegmentGeo {
  surface: SurfaceType;
  distance_km: number;
  coordinates: [number, number][];
}

function mapSurface(orsValue: number): SurfaceType {
  if ([0, 2, 3, 13].includes(orsValue)) return 'goudron';
  if ([7, 8, 9].includes(orsValue)) return 'piste_praticable';
  return 'piste_degradee';
}

export async function POST(req: NextRequest) {
  const { depart, arrivee } = await req.json();

  const orsRes = await fetch(
    'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
    {
      method: 'POST',
      headers: {
        Authorization: process.env.ORS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: [depart, arrivee],
        extra_info: ['surface', 'waytype'],
      }),
    }
  );

  if (!orsRes.ok) {
    return NextResponse.json({ error: 'Erreur ORS' }, { status: 502 });
  }

  const data = await orsRes.json();
  const feature = data.features[0];
  const coords: [number, number][] = feature.geometry.coordinates;
  const surfaceExtra: number[][] = feature.properties.extras.surface.values; // [[startIdx, endIdx, code], ...]
  const totalDistance = feature.properties.summary.distance; // mètres
  const totalPoints = coords.length;

  const segments: SegmentGeo[] = surfaceExtra.map(([start, end, code]) => {
    const proportion = (end - start) / totalPoints;
    return {
      surface: mapSurface(code),
      distance_km: (proportion * totalDistance) / 1000,
      coordinates: coords.slice(start, end + 1),
    };
  });

  const km_goudron = segments.filter(s => s.surface === 'goudron').reduce((a, s) => a + s.distance_km, 0);
  const km_piste_praticable = segments.filter(s => s.surface === 'piste_praticable').reduce((a, s) => a + s.distance_km, 0);
  const km_piste_degradee = segments.filter(s => s.surface === 'piste_degradee').reduce((a, s) => a + s.distance_km, 0);

  return NextResponse.json({
    segments,
    km_goudron,
    km_piste_praticable,
    km_piste_degradee,
    a_de_la_piste: km_piste_praticable + km_piste_degradee > 0,
  });
}