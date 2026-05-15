import type { LngLat } from './mapbox';

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY as string;

if (!ORS_API_KEY) {
  console.warn('VITE_ORS_API_KEY is missing. Set it in .env.local');
}

export type TransitMode = 'walking' | 'biking';

const PROFILE: Record<TransitMode, string> = {
  walking: 'foot-walking',
  biking: 'cycling-regular',
};

export type IsochroneFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      contour: number;
      color: string;
      opacity: number;
      fill: string;
      'fill-opacity': number;
    };
    geometry:
      | { type: 'Polygon'; coordinates: number[][][] }
      | { type: 'MultiPolygon'; coordinates: number[][][][] };
  }>;
};

type OrsResponse = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: { value: number; center: number[] };
    geometry: { type: 'Polygon'; coordinates: number[][][] };
  }>;
};

async function fetchBatch(
  point: LngLat,
  mode: TransitMode,
  rangeSeconds: number[],
): Promise<OrsResponse> {
  const url = `https://api.openrouteservice.org/v2/isochrones/${PROFILE[mode]}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: ORS_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/geo+json',
    },
    body: JSON.stringify({
      locations: [[point.lng, point.lat]],
      range: rangeSeconds,
      range_type: 'time',
      smoothing: 25,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ORS isochrones failed: ${res.status} ${text}`.trim());
  }
  return (await res.json()) as OrsResponse;
}

export async function fetchIsochrones(
  point: LngLat,
  mode: TransitMode,
  contoursMinutes: number[],
): Promise<IsochroneFeatureCollection> {
  // ORS free tier caps at 5 ranges per request — split if needed.
  const batches: number[][] = [];
  for (let i = 0; i < contoursMinutes.length; i += 5) {
    batches.push(contoursMinutes.slice(i, i + 5));
  }

  const results = await Promise.all(
    batches.map((b) => fetchBatch(point, mode, b.map((m) => m * 60))),
  );

  const features = results.flatMap((r) =>
    r.features.map((f) => ({
      type: 'Feature' as const,
      properties: {
        contour: Math.round(f.properties.value / 60),
        color: '',
        opacity: 0,
        fill: '',
        'fill-opacity': 0,
      },
      geometry: f.geometry,
    })),
  );

  return { type: 'FeatureCollection', features };
}
