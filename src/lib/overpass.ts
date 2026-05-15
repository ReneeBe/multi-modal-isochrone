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

function polygonToOverpassPoly(coords: number[][]): string {
  // Decimate to at most ~60 vertices. Overpass evaluates `poly:` point-by-point
  // and very high-resolution rings are a major source of latency.
  const stride = Math.max(1, Math.ceil(coords.length / 60));
  const decimated: number[][] = [];
  for (let i = 0; i < coords.length; i += stride) decimated.push(coords[i]);
  if (decimated[decimated.length - 1] !== coords[coords.length - 1]) {
    decimated.push(coords[coords.length - 1]);
  }
  return decimated.map(([lng, lat]) => `${lat} ${lng}`).join(' ');
}

async function countOnePredicate(predicate: string, poly: string): Promise<number> {
  const query = `[out:json][timeout:25];(${predicate}(poly:"${poly}"););out count;`;

  let lastError: Error | null = null;
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (res.status === 429 || res.status === 504) {
        lastError = new Error(`${endpoint} returned ${res.status}`);
        continue;
      }
      if (!res.ok) {
        lastError = new Error(`Overpass failed: ${res.status}`);
        continue;
      }
      const data = (await res.json()) as {
        elements: Array<{ tags?: { total?: string } }>;
      };
      const total = data.elements?.[0]?.tags?.total;
      return total ? parseInt(total, 10) : 0;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError ?? new Error('All Overpass endpoints failed');
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

  const poly = polygonToOverpassPoly(ring);

  const [restaurants, cafes, parks, transit] = await Promise.all([
    countOnePredicate('nwr["amenity"="restaurant"]', poly),
    countOnePredicate('nwr["amenity"="cafe"]', poly),
    countOnePredicate('nwr["leisure"="park"]', poly),
    countOnePredicate(
      'nwr["public_transport"="station"];nwr["railway"="station"];nwr["highway"="bus_stop"]',
      poly,
    ),
  ]);

  return { restaurants, cafes, parks, transit };
}
