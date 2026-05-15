export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

if (!MAPBOX_TOKEN) {
  console.warn('VITE_MAPBOX_TOKEN is missing. Set it in .env.local');
}

export type LngLat = { lng: number; lat: number };

export type GeocodeResult = {
  placeName: string;
  center: LngLat;
};

export async function geocode(query: string): Promise<GeocodeResult | null> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
  );
  url.searchParams.set('access_token', MAPBOX_TOKEN);
  url.searchParams.set('limit', '1');
  url.searchParams.set('types', 'address,place,locality,neighborhood,poi');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
  const data = (await res.json()) as {
    features: Array<{ place_name: string; center: [number, number] }>;
  };
  const f = data.features[0];
  if (!f) return null;
  return {
    placeName: f.place_name,
    center: { lng: f.center[0], lat: f.center[1] },
  };
}

export async function reverseGeocode(point: LngLat): Promise<string> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${point.lng},${point.lat}.json`,
  );
  url.searchParams.set('access_token', MAPBOX_TOKEN);
  url.searchParams.set('limit', '1');

  const res = await fetch(url.toString());
  if (!res.ok) return `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
  const data = (await res.json()) as {
    features: Array<{ place_name: string }>;
  };
  return data.features[0]?.place_name ?? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
}
