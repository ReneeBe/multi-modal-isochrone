import type { PoiCounts } from '../lib/overpass';
import type { TransitMode } from '../lib/ors';

type Props = {
  pois: PoiCounts | null;
  isLoading: boolean;
  largestMinutes: number | null;
  mode: TransitMode;
};

const ITEMS: Array<{ key: keyof PoiCounts; label: string; emoji: string }> = [
  { key: 'restaurants', label: 'Restaurants', emoji: '🍽️' },
  { key: 'cafes', label: 'Cafés', emoji: '☕' },
  { key: 'parks', label: 'Parks', emoji: '🌳' },
  { key: 'transit', label: 'Transit stops', emoji: '🚉' },
];

export function StatPanel({ pois, isLoading, largestMinutes, mode }: Props) {
  const verb = mode === 'walking' ? 'walk' : 'ride';
  return (
    <div className="backdrop-blur border rounded-xl p-3 flex flex-col gap-2 bg-white/80 border-zinc-300/60 dark:bg-zinc-900/80 dark:border-zinc-700/60">
      <p className="text-[11px] uppercase tracking-wider px-1 text-zinc-500 dark:text-zinc-500">
        Within {largestMinutes ?? '—'} min {verb}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {ITEMS.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 bg-zinc-100/80 dark:bg-zinc-950/60"
          >
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              {item.emoji} {item.label}
            </span>
            {isLoading ? (
              <span className="skeleton inline-block w-6 h-3.5" />
            ) : (
              <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-white">
                {pois?.[item.key] ?? 'n/a'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
