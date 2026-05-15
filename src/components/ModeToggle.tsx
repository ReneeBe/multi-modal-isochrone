import type { TransitMode } from '../lib/ors';

type Props = {
  mode: TransitMode;
  onChange: (mode: TransitMode) => void;
};

export function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="self-start inline-flex p-1 rounded-xl backdrop-blur border bg-white/80 border-zinc-300/60 dark:bg-zinc-900/80 dark:border-zinc-700/60">
      <Button active={mode === 'walking'} onClick={() => onChange('walking')}>
        <WalkIcon />
        Walk
      </Button>
      <Button active={mode === 'biking'} onClick={() => onChange('biking')}>
        <BikeIcon />
        Bike
      </Button>
    </div>
  );
}

function Button({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? 'bg-fuchsia-600 text-white'
          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function WalkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2" />
      <path d="M15 22l-3-7-2-2 4-4 4 3 3-1" />
      <path d="M9 9l-2 4 3 3v6" />
    </svg>
  );
}

function BikeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <circle cx="15" cy="5" r="1" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </svg>
  );
}
