import { gradientCss } from '../lib/colors';
import type { TransitMode } from '../lib/ors';

type Props = {
  contours: number[];
  loading: boolean;
  mode: TransitMode;
};

export function Legend({ contours, loading, mode }: Props) {
  if (contours.length === 0) return null;
  const min = Math.min(...contours);
  const max = Math.max(...contours);
  const span = max - min || 1;

  const label = mode === 'walking' ? 'Walk time (min)' : 'Bike time (min)';

  return (
    <div className="backdrop-blur border rounded-xl p-3 flex flex-col gap-2 w-60 bg-white/80 border-zinc-300/60 dark:bg-zinc-900/80 dark:border-zinc-700/60">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        {label}
      </p>
      <div className="relative">
        {loading ? (
          <div className="skeleton h-2.5 rounded-full" />
        ) : (
          <div className="h-2.5 rounded-full" style={{ background: gradientCss(contours) }} />
        )}
        <div className="relative mt-1.5 h-4">
          {contours.map((m) => {
            const pct = ((m - min) / span) * 100;
            return (
              <span
                key={m}
                className="absolute -translate-x-1/2 text-[10px] tabular-nums text-zinc-600 dark:text-zinc-400"
                style={{ left: `${pct}%` }}
              >
                {m}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
