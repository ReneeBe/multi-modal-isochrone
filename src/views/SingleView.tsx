import { useState } from 'react';
import { Map } from '../components/Map';
import { SearchBar } from '../components/SearchBar';
import { StatPanel } from '../components/StatPanel';
import { ModeToggle } from '../components/ModeToggle';
import { ThemeToggle } from '../components/ThemeToggle';
import { Legend } from '../components/Legend';
import type { TransitMode } from '../lib/ors';
import { useIsochrones } from '../lib/useIsochrones';
import { usePinAndSearch } from '../lib/usePinAndSearch';
import { CONTOURS_BY_MODE, POI_TARGET_BY_MODE } from '../lib/contours';

type Theme = 'light' | 'dark';

type Props = {
  theme: Theme;
  onToggleTheme: () => void;
  onEnterCompare: () => void;
};

export function SingleView({ theme, onToggleTheme, onEnterCompare }: Props) {
  const [mode, setMode] = useState<TransitMode>('walking');
  const {
    pin,
    placeName,
    searchError,
    isLocating,
    handleSearch,
    handleUseMyLocation,
    handleMapClick,
  } = usePinAndSearch();

  const contours = CONTOURS_BY_MODE[mode];
  const poiMinutes = POI_TARGET_BY_MODE[mode];

  const { isochrones, pois, loadingIso, loadingPois, error: fetchError } = useIsochrones(
    pin,
    mode,
    contours,
    poiMinutes,
  );

  const error = searchError ?? fetchError;
  const heading = mode === 'walking' ? 'Walking reach' : 'Biking reach';
  const subheading =
    mode === 'walking'
      ? 'Drop a pin or search an address. See how far you can walk in 5, 10, 20, 30, 45, or 60 minutes.'
      : 'Drop a pin or search an address. See how far you can bike in 5, 10, 15, 20, 30, or 45 minutes — slope-aware, no stairs.';

  return (
    <>
      <Map
        pin={pin}
        isochrones={isochrones}
        onMapClick={handleMapClick}
        theme={theme}
        placeName={placeName}
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col p-4 md:p-6 gap-3">
        <div className="flex justify-between items-start gap-3">
          <div className="pointer-events-auto flex flex-col gap-3 max-w-md">
            <div className="flex flex-col gap-1">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-emboss text-zinc-900 dark:text-white">
                {heading}
              </h1>
              <p className="text-xs font-medium text-emboss text-zinc-700 dark:text-zinc-300">
                {subheading}
              </p>
            </div>

            <ModeToggle mode={mode} onChange={setMode} />

            <SearchBar
              onSearch={handleSearch}
              onUseMyLocation={handleUseMyLocation}
              isLoading={loadingIso}
              isLocating={isLocating}
              placeName={placeName}
            />

            {error && (
              <p className="text-xs px-3 py-2 rounded-xl backdrop-blur border bg-red-100/80 border-red-300/70 text-red-800 dark:bg-red-950/70 dark:border-red-900/60 dark:text-red-300">
                {error}
              </p>
            )}

            {pin && (
              <StatPanel
                pois={pois}
                isLoading={loadingPois}
                largestMinutes={poiMinutes}
                mode={mode}
              />
            )}

            <button
              type="button"
              onClick={onEnterCompare}
              className="self-start text-xs px-2.5 py-1.5 rounded-lg backdrop-blur border transition-colors bg-white/80 border-zinc-300/60 text-zinc-700 hover:bg-white hover:text-fuchsia-600 dark:bg-zinc-900/80 dark:border-zinc-700/60 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-fuchsia-400"
            >
              Compare side-by-side →
            </button>
          </div>

          <div className="pointer-events-auto">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>

        <div className="flex-1" />

        <div className="pointer-events-auto self-end">
          <Legend contours={contours} loading={loadingIso && !!pin} mode={mode} />
        </div>
      </div>
    </>
  );
}
