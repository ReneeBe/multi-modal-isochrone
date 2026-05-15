import { useState } from 'react';

type Props = {
  onSearch: (query: string) => void;
  onUseMyLocation: () => void;
  isLoading: boolean;
  isLocating: boolean;
  placeName: string | null;
};

export function SearchBar({
  onSearch,
  onUseMyLocation,
  isLoading,
  isLocating,
  placeName,
}: Props) {
  const [value, setValue] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onSearch(value.trim());
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter an address or place"
          className="flex-1 backdrop-blur border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors bg-white/80 border-zinc-300/60 text-zinc-900 placeholder:text-zinc-500 focus:border-fuchsia-500/60 focus:bg-white dark:bg-zinc-900/80 dark:border-zinc-700/60 dark:text-white dark:placeholder:text-zinc-500 dark:focus:bg-zinc-900"
          autoFocus
        />
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-colors"
        >
          {isLoading ? '…' : 'Go'}
        </button>
      </div>
      <button
        type="button"
        onClick={onUseMyLocation}
        disabled={isLocating || isLoading}
        className="self-start text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur border transition-colors bg-white/80 border-zinc-300/60 text-zinc-700 hover:bg-white hover:text-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-900/80 dark:border-zinc-700/60 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-fuchsia-400"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
        {isLocating ? 'Locating…' : 'Use my location'}
      </button>
      {placeName && (
        <p className="text-xs px-1 truncate font-medium text-emboss text-zinc-700 dark:text-zinc-300">
          📍 {placeName}
        </p>
      )}
    </form>
  );
}
