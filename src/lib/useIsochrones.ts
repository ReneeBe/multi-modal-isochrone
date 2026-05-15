import { useEffect, useState } from 'react';
import type { LngLat } from './mapbox';
import {
  fetchIsochrones,
  type IsochroneFeatureCollection,
  type TransitMode,
} from './ors';
import { styleIsochrones } from './colors';
import { countPoisInIsochrone, type PoiCounts } from './overpass';

type UseIsochronesResult = {
  isochrones: IsochroneFeatureCollection | null;
  pois: PoiCounts | null;
  loadingIso: boolean;
  loadingPois: boolean;
  error: string | null;
};

export function useIsochrones(
  pin: LngLat | null,
  mode: TransitMode,
  contours: number[],
  poiTargetMin: number,
): UseIsochronesResult {
  const [isochrones, setIsochrones] = useState<IsochroneFeatureCollection | null>(null);
  const [pois, setPois] = useState<PoiCounts | null>(null);
  const [loadingIso, setLoadingIso] = useState(false);
  const [loadingPois, setLoadingPois] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pin) {
      setIsochrones(null);
      setPois(null);
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setError(null);
      setLoadingIso(true);
      setIsochrones(null);
      setPois(null);
      try {
        const fc = await fetchIsochrones(pin, mode, contours);
        if (cancelled) return;
        const styled = styleIsochrones(fc, contours);
        setIsochrones(styled);
        setLoadingIso(false);

        setLoadingPois(true);
        try {
          const counts = await countPoisInIsochrone(fc, poiTargetMin);
          if (cancelled) return;
          setPois(counts);
        } catch (poiErr) {
          if (cancelled) return;
          console.warn('POI count failed:', poiErr);
          setPois(null);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Something went wrong');
      } finally {
        if (!cancelled) {
          setLoadingIso(false);
          setLoadingPois(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pin, mode, contours, poiTargetMin]);

  return { isochrones, pois, loadingIso, loadingPois, error };
}
