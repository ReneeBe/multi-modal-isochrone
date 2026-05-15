import difference from '@turf/difference';
import { featureCollection, polygon } from '@turf/helpers';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import type { IsochroneFeatureCollection } from './ors';

// Spectral palette, six steps. Each contour gets one color by sorted index,
// so this works for any 6-contour set (walking, biking, etc.).
const SPECTRAL: string[] = [
  '#d53e4f', // red
  '#fc8d59', // orange
  '#fee08b', // yellow
  '#e6f598', // chartreuse
  '#99d594', // green
  '#3288bd', // blue
];

function colorForContour(contour: number, allContours: number[]): string {
  const sorted = [...allContours].sort((a, b) => a - b);
  const idx = sorted.indexOf(contour);
  if (idx < 0) return SPECTRAL[SPECTRAL.length - 1];
  return SPECTRAL[Math.min(idx, SPECTRAL.length - 1)];
}

export function styleIsochrones(
  fc: IsochroneFeatureCollection,
  allContours: number[],
): IsochroneFeatureCollection {
  if (allContours.length === 0) {
    return { type: 'FeatureCollection', features: [] };
  }

  const ascending = [...fc.features].sort(
    (a, b) => a.properties.contour - b.properties.contour,
  );

  const bands: Array<{ feature: Feature<Polygon | MultiPolygon>; contour: number }> = [];
  for (let i = 0; i < ascending.length; i++) {
    const f = ascending[i];
    const coords = f.geometry.type === 'Polygon'
      ? f.geometry.coordinates
      : f.geometry.coordinates[0];
    const fPoly = polygon(coords as number[][][]);

    if (i === 0) {
      bands.push({ feature: fPoly, contour: f.properties.contour });
      continue;
    }

    const prev = ascending[i - 1];
    const prevCoords = prev.geometry.type === 'Polygon'
      ? prev.geometry.coordinates
      : prev.geometry.coordinates[0];
    const prevPoly = polygon(prevCoords as number[][][]);

    try {
      const collection = featureCollection([fPoly, prevPoly]);
      const diff = difference(collection);
      if (diff) {
        bands.push({ feature: diff, contour: f.properties.contour });
      }
    } catch {
      bands.push({ feature: fPoly, contour: f.properties.contour });
    }
  }

  return {
    type: 'FeatureCollection',
    features: bands.map(({ feature, contour }) => {
      const color = colorForContour(contour, allContours);
      return {
        type: 'Feature' as const,
        geometry: feature.geometry,
        properties: {
          contour,
          fill: color,
          color,
          'fill-opacity': 0.45,
          opacity: 1,
        },
      };
    }),
  } as IsochroneFeatureCollection;
}

export function gradientCss(contours: number[]): string {
  if (contours.length === 0) return 'transparent';
  const sorted = [...contours].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const span = max - min || 1;
  const stops = sorted
    .map((c, i) => {
      const hex = SPECTRAL[Math.min(i, SPECTRAL.length - 1)];
      const pct = ((c - min) / span) * 100;
      return `${hex} ${pct.toFixed(0)}%`;
    })
    .join(', ');
  return `linear-gradient(to right, ${stops})`;
}
