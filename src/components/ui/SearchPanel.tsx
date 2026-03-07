import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import starsData from '../../data/stars.json';
import { calculatePlanetPositions, equatorialToHorizontal } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';
import type { Star, CelestialObject } from '../../types';

const stars = starsData as Star[];

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
    <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />
  </svg>
);

const PlanetIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2">
    <circle cx="12" cy="12" r="8" />
    <ellipse cx="12" cy="12" rx="12" ry="4" />
  </svg>
);

export default function SearchPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { setSelectedObject, setCameraTarget, observer } = useAppStore();

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const planets = useMemo(() => calculatePlanetPositions(observer), [observer]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    // Search stars
    const starResults = stars
      .filter((s) => s.name && s.name.toLowerCase().includes(q))
      .slice(0, 8)
      .map((s) => {
        const hz = equatorialToHorizontal(s.ra, s.dec, observer);
        return {
          id: `star-${s.hip}`,
          name: s.name!,
          type: 'star' as const,
          ra: s.ra,
          dec: s.dec,
          azimuth: hz.azimuth,
          altitude: hz.altitude,
          magnitude: s.mag,
          spectral: s.spectral,
          constellation: s.constellation || undefined,
        };
      });

    // Search planets
    const planetResults = planets
      .filter((p) => p.name.toLowerCase().includes(q))
      .map((p) => ({
        id: `planet-${p.name.toLowerCase()}`,
        name: p.name,
        type: 'planet' as const,
        ra: p.ra,
        dec: p.dec,
        azimuth: p.azimuth,
        altitude: p.altitude,
        magnitude: p.magnitude,
      }));

    return [...planetResults, ...starResults].slice(0, 10);
  }, [query, observer, planets]);

  const handleSelect = useCallback(
    (obj: CelestialObject) => {
      setSelectedObject(obj);
      setCameraTarget({ ra: obj.ra, dec: obj.dec });
      setIsOpen(false);
      setQuery('');
    },
    [setSelectedObject, setCameraTarget]
  );

  // Quick access suggestions
  const suggestions = useMemo(() => {
    const bright = stars
      .filter((s) => s.name && s.mag < 1.5)
      .sort((a, b) => a.mag - b.mag)
      .slice(0, 4)
      .map((s) => s.name!);
    return [...bright, 'Jupiter', 'Moon'];
  }, []);

  return (
    <>
      {/* Search trigger button */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setIsOpen(true)}
          className="fixed top-5 left-5 z-50 glass-panel-compact px-4 py-2.5 
                     flex items-center gap-3 cursor-pointer group
                     hover:border-ainos-panel-border-hover transition-all duration-300 pointer-events-auto"
        >
          <SearchIcon />
          <span className="text-ainos-text-dim text-sm group-hover:text-ainos-text transition-colors">
            Search sky...
          </span>
          <kbd className="text-[10px] text-ainos-text-muted bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
            /
          </kbd>
        </motion.button>
      )}

      {/* Search panel overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-5 left-5 z-50 w-96 glass-panel overflow-hidden pointer-events-auto"
          >
            {/* Search input */}
            <div className="relative flex items-center px-4 py-3 border-b border-ainos-panel-border">
              <SearchIcon />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stars, planets, constellations..."
                className="flex-1 bg-transparent text-sm text-ainos-text placeholder:text-ainos-text-muted 
                          outline-none ml-3 font-light"
              />
              <button
                onClick={() => { setIsOpen(false); setQuery(''); }}
                className="text-ainos-text-dim hover:text-ainos-text p-1 cursor-pointer transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Results */}
            {query.trim() && results.length > 0 && (
              <div className="max-h-72 overflow-y-auto">
                {results.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => handleSelect(obj)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left
                             hover:bg-white/5 transition-colors cursor-pointer border-b border-white/3 last:border-0"
                  >
                    <div className="flex-shrink-0">
                      {obj.type === 'star' ? <StarIcon /> : <PlanetIcon />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ainos-text truncate">{obj.name}</div>
                      <div className="text-[11px] text-ainos-text-dim">
                        {obj.type === 'star' ? 'Star' : 'Planet'}
                        {obj.magnitude !== undefined && ` · mag ${obj.magnitude.toFixed(1)}`}
                        {obj.constellation && ` · ${obj.constellation}`}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {obj.altitude !== undefined && (
                        <span className={`text-xs font-mono ${obj.altitude > 0 ? 'text-ainos-success' : 'text-ainos-danger'}`}>
                          {obj.altitude > 0 ? '▲' : '▼'} {Math.abs(obj.altitude).toFixed(1)}°
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {query.trim() && results.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-ainos-text-dim">
                No objects found for "{query}"
              </div>
            )}

            {/* Quick access suggestions */}
            {!query.trim() && (
              <div className="px-4 py-3">
                <div className="text-[10px] uppercase tracking-wider text-ainos-text-muted mb-2 font-medium">
                  Quick Access
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((name) => (
                    <button
                      key={name}
                      onClick={() => setQuery(name)}
                      className="px-2.5 py-1 text-xs text-ainos-text-dim bg-white/4 
                               rounded-full border border-white/6 hover:bg-white/8 
                               hover:text-ainos-text cursor-pointer transition-all"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
