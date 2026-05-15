import type { IsochroneFeatureCollection } from './ors';

export type PoiCounts = {
  restaurants: number;
  cafes: number;
  parks: number;
  transit: number;
};

const ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
];

function bboxOf(coords: number[][]): [number, number, number, number] {
  let minLat = Infinity,
    minLng = Infinity,
    maxLat = -Infinity,
    maxLng = -Infinity;
  for (const [lng, lat] of coords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return [minLat, minLng, maxLat, maxLng];
}

export async function countPoisInIsochrone(
  isochrones: IsochroneFeatureCollection,
  targetMinutes: number,
): Promise<PoiCounts> {
  const target = isochrones.features
    .slice()
    .sort(
      (a, b) =>
        Math.abs(a.properties.contour - targetMinutes) -
        Math.abs(b.properties.contour - targetMinutes),
    )[0];
  if (!target) return { restaurants: 0, cafes: 0, parks: 0, transit: 0 };

  const ring =
    target.geometry.type === 'Polygon'
      ? (target.geometry.coordinates[0] as number[][] | undefined)
      : (target.geometry.coordinates[0]?.[0] as number[][] | undefined);
  if (!ring || ring.length < 4) return { restaurants: 0, cafes: 0, parks: 0, transit: 0 };

  // Use the bounding box instead of the polygon. Counts are approximate
  // (POIs in the bbox corners that fall outside the actual polygon are
  // counted), but the query is dramatically faster: bbox lookups are
  // index-accelerated; poly lookups iterate vertex-by-vertex.
  const [s, w, n, e] = bboxOf(ring);
  const bbox = `${s.toFixed(5)},${w.toFixed(5)},${n.toFixed(5)},${e.toFixed(5)}`;

  // Single query, four named sets, four `out count;` statements.
  // One roundtrip instead of four.
  const query = `
[out:json][timeout:25];
(nwr["amenity"="restaurant"](${bbox}););
out count;
(nwr["amenity"="cafe"](${bbox}););
out count;
(nwr["leisure"="park"](${bbox}););
out count;
(nwr["public_transport"="station"](${bbox});
 nwr["railway"="station"](${bbox});
 nwr["highway"="bus_stop"](${bbox}););
out count;
  `.trim();

  // Race all endpoints in parallel — first non-error wins. Public Overpass
  // mirrors have different rate limits and queue depths; with three in flight
  // we get the response from whichever happens to be free.
  const controller = new AbortController();
  const data = await Promise.any(
    ENDPOINTS.map(async (endpoint) => {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`${endpoint} returned ${res.status}`);
      return (await res.json()) as {
        elements: Array<{ type: string; tags?: { total?: string } }>;
      };
    }),
  ).catch(() => null);
  // Cancel any losers so we don't keep their sockets open.
  controller.abort();
  if (!data) throw new Error('All Overpass endpoints failed');
  return parseCountsResponse(data);
}

function parseCountsResponse(data: {
  elements: Array<{ type: string; tags?: { total?: string } }>;
}): PoiCounts {
  const counts: PoiCounts = { restaurants: 0, cafes: 0, parks: 0, transit: 0 };
  const countEls = data.elements.filter((el) => el.type === 'count');
  // Order matches the query: restaurants, cafes, parks, transit.
  counts.restaurants = parseInt(countEls[0]?.tags?.total ?? '0', 10);
  counts.cafes = parseInt(countEls[1]?.tags?.total ?? '0', 10);
  counts.parks = parseInt(countEls[2]?.tags?.total ?? '0', 10);
  counts.transit = parseInt(countEls[3]?.tags?.total ?? '0', 10);
  return counts;
}
