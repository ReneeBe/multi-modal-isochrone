import { useEffect, useState } from 'react';
import { SingleView } from './views/SingleView';
import { CompareView } from './views/CompareView';

type Theme = 'light' | 'dark';

function getInitialView(): 'single' | 'compare' {
  if (typeof window === 'undefined') return 'single';
  const params = new URLSearchParams(window.location.search);
  return params.get('view') === 'compare' ? 'compare' : 'single';
}

export default function App() {
  const [view, setView] = useState<'single' | 'compare'>(getInitialView);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('isochrone-theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('isochrone-theme', theme);
  }, [theme]);

  // Keep view in sync with URL on back/forward navigation.
  useEffect(() => {
    const onPop = () => setView(getInitialView());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (next: 'single' | 'compare') => {
    const url = new URL(window.location.href);
    if (next === 'compare') url.searchParams.set('view', 'compare');
    else url.searchParams.delete('view');
    window.history.pushState({}, '', url);
    setView(next);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {view === 'compare' ? (
        <CompareView
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onExitCompare={() => navigate('single')}
        />
      ) : (
        <SingleView
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onEnterCompare={() => navigate('compare')}
        />
      )}
    </div>
  );
}
