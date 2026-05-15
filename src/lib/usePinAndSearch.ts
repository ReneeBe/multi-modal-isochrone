import { useState } from 'react';
import { geocode, reverseGeocode, type LngLat } from './mapbox';

type UsePinAndSearchResult = {
  pin: LngLat | null;
  placeName: string | null;
  searchError: string | null;
  isLocating: boolean;
  handleSearch: (query: string) => Promise<void>;
  handleUseMyLocation: () => void;
  handleMapClick: (point: LngLat) => Promise<void>;
};

export function usePinAndSearch(): UsePinAndSearchResult {
  const [pin, setPin] = useState<LngLat | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchError(null);
    try {
      const result = await geocode(query);
      if (!result) {
        setSearchError('No results for that query');
        return;
      }
      setPlaceName(result.placeName);
      setPin(result.center);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Geocoding failed');
    }
  };

  const handleUseMyLocation = () => {
    setSearchError(null);
    if (!('geolocation' in navigator)) {
      setSearchError('Geolocation is not supported by this browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const point: LngLat = {
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
        };
        setPin(point);
        setPlaceName(null);
        try {
          const name = await reverseGeocode(point);
          setPlaceName(name);
        } catch {
          // ignore
        }
      },
      (err) => {
        setIsLocating(false);
        setSearchError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied'
            : 'Could not get your location',
        );
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleMapClick = async (point: LngLat) => {
    setPin(point);
    setPlaceName(null);
    try {
      const name = await reverseGeocode(point);
      setPlaceName(name);
    } catch {
      // ignore
    }
  };

  return {
    pin,
    placeName,
    searchError,
    isLocating,
    handleSearch,
    handleUseMyLocation,
    handleMapClick,
  };
}
