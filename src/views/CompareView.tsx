import { Map } from '../components/Map';
import { SearchBar } from '../components/SearchBar';
import { StatPanel } from '../components/StatPanel';
import { ThemeToggle } from '../components/ThemeToggle';
import { Legend } from '../components/Legend';
import type { PoiCounts } from '../lib/overpass';
import { useIsochrones } from '../lib/useIsochrones';
import { usePinAndSearch } from '../lib/usePinAndSearch';
import { CONTOURS_BY_MODE, POI_TARGET_BY_MODE } from '../lib/contours';

type Theme = 'light' | 'dark';

type Props = {
  theme: Theme;
  onToggleTheme: () => void;
  onExitCompare: () => void;
};

export function CompareView({ theme, onToggleTheme, onExitCompare }: Props) {
  const {
    pin,
    placeName,
    searchError,
    isLocating,
    handleSearch,
    handleUseMyLocation,
    handleMapClick,
  } = usePinAndSearch();

  const walking = useIsochrones(
    pin,
    'walking',
    CONTOURS_BY_MODE.walking,
    POI_TARGET_BY_MODE.walking,
  );
  const biking = useIsochrones(
    pin,
    'biking',
    CONTOURS_BY_MODE.biking,
    POI_TARGET_BY_MODE.biking,
  );

  const error = searchError ?? walking.error ?? biking.error;
  const anyLoading = walking.loadingIso || biking.loadingIso;

  return (
    <>
      {/* Top bar with controls (full-width, above the maps) */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 md:p-6 flex justify-between items-start gap-3 pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-3 max-w-md">
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-emboss text-zinc-900 dark:text-white">
            Walkshed vs Bikeshed
          </h1>

          <SearchBar
            onSearch={handleSearch}
            onUseMyLocation={handleUseMyLocation}
            isLoading={anyLoading}
            isLocating={isLocating}
            placeName={placeName}
          />

          {error && (
            <p className="text-xs px-3 py-2 rounded-xl backdrop-blur border bg-red-100/80 border-red-300/70 text-red-800 dark:bg-red-950/70 dark:border-red-900/60 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={onExitCompare}
            className="self-start text-xs px-2.5 py-1.5 rounded-lg backdrop-blur border transition-colors bg-white/80 border-zinc-300/60 text-zinc-700 hover:bg-white hover:text-fuchsia-600 dark:bg-zinc-900/80 dark:border-zinc-700/60 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-fuchsia-400"
          >
            ← Back to single view
          </button>
        </div>

        <div className="pointer-events-auto">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>

      {/* Two stacked half-screen maps with a divider between them */}
      <div className="absolute inset-0 grid grid-cols-2">
        <MapPanel
          theme={theme}
          pin={pin}
          placeName={placeName}
          isochrones={walking.isochrones}
          loadingIso={walking.loadingIso}
          pois={walking.pois}
          loadingPois={walking.loadingPois}
          onMapClick={handleMapClick}
          contours={CONTOURS_BY_MODE.walking}
          poiTarget={POI_TARGET_BY_MODE.walking}
          mode="walking"
          label="Walking"
          isLeft
        />
        <MapPanel
          theme={theme}
          pin={pin}
          placeName={placeName}
          isochrones={biking.isochrones}
          loadingIso={biking.loadingIso}
          pois={biking.pois}
          loadingPois={biking.loadingPois}
          onMapClick={handleMapClick}
          contours={CONTOURS_BY_MODE.biking}
          poiTarget={POI_TARGET_BY_MODE.biking}
          mode="biking"
          label="Biking"
          isLeft={false}
        />
      </div>

      {/* Center divider sitting on top of both maps */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-zinc-400/60 dark:bg-zinc-600/60 z-10" />
    </>
  );
}

type MapPanelProps = {
  theme: Theme;
  pin: ReturnType<typeof usePinAndSearch>['pin'];
  placeName: string | null;
  isochrones: ReturnType<typeof useIsochrones>['isochrones'];
  loadingIso: boolean;
  pois: PoiCounts | null;
  loadingPois: boolean;
  onMapClick: ReturnType<typeof usePinAndSearch>['handleMapClick'];
  contours: number[];
  poiTarget: number;
  mode: 'walking' | 'biking';
  label: string;
  isLeft: boolean;
};

function MapPanel({
  theme,
  pin,
  placeName,
  isochrones,
  loadingIso,
  pois,
  loadingPois,
  onMapClick,
  contours,
  poiTarget,
  mode,
  label,
  isLeft,
}: MapPanelProps) {
  return (
    <div className="relative h-full overflow-hidden">
      <Map
        pin={pin}
        isochrones={isochrones}
        onMapClick={onMapClick}
        theme={theme}
        placeName={placeName}
      />

      {/* Mode label — plain embossed text near the divider, no button styling */}
      <div
        className={`absolute top-5 ${isLeft ? 'right-6' : 'left-6'} pointer-events-none z-20`}
      >
        <span className="text-base md:text-lg font-black tracking-[0.2em] uppercase text-emboss text-fuchsia-700 dark:text-fuchsia-300">
          {label}
        </span>
      </div>

      {/* Stat panel + legend stacked at the OUTER corner of each panel,
          so the left panel's UI hugs the left edge and the right panel's
          hugs the right edge — symmetric and away from the divider. */}
      <div
        className={`absolute bottom-4 ${isLeft ? 'left-4' : 'right-4'} pointer-events-auto flex flex-col gap-2 w-60 z-20`}
      >
        {pin && (
          <StatPanel
            pois={pois}
            isLoading={loadingPois}
            largestMinutes={poiTarget}
            mode={mode}
          />
        )}
        <Legend contours={contours} loading={loadingIso && !!pin} mode={mode} />
      </div>
    </div>
  );
}
