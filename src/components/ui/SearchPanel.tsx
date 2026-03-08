import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculatePlanetPositions, equatorialToHorizontal } from '../../utils/astronomy';
import { buildConstellationCatalog, getConstellationObjects } from '../../utils/catalog';
import { useAppStore } from '../../store/useAppStore';
import { useCatalogStore } from '../../store/useCatalogStore';
import type { CelestialObject } from '../../types';

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

const ConstellationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8">
    <circle cx="5" cy="7" r="1.5" fill="#60a5fa" stroke="none" />
    <circle cx="18" cy="5" r="1.5" fill="#60a5fa" stroke="none" />
    <circle cx="19" cy="17" r="1.5" fill="#60a5fa" stroke="none" />
    <circle cx="7" cy="19" r="1.5" fill="#60a5fa" stroke="none" />
    <path d="M5 7 18 5 19 17 7 19 5 7" />
  </svg>
);

const GalaxyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff9966" strokeWidth="1.5">
    <ellipse cx="12" cy="12" rx="10" ry="5" />
    <ellipse cx="12" cy="12" rx="6" ry="3" />
    <circle cx="12" cy="12" r="2" fill="#ff9966" />
  </svg>
);

const NebulaIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cc99ff" strokeWidth="1.5">
    <circle cx="12" cy="12" r="8" opacity="0.5" />
    <circle cx="12" cy="12" r="5" opacity="0.7" />
    <circle cx="12" cy="12" r="2" fill="#cc99ff" />
  </svg>
);

const ClusterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#66ff66" stroke="none">
    <circle cx="12" cy="8" r="2" />
    <circle cx="8" cy="14" r="2" />
    <circle cx="16" cy="14" r="2" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="10" cy="10" r="1" />
    <circle cx="14" cy="10" r="1" />
  </svg>
);

function getPlanetResultType(name: string): CelestialObject['type'] {
  if (name === 'Moon') return 'moon';
  if (name === 'Sun') return 'sun';
  return 'planet';
}

export default function SearchPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { setSelectedObject, setCameraTarget, observer, simulationTime } = useAppStore();
  const stars = useCatalogStore((s) => s.stars);
  const skyConstellations = useCatalogStore((s) => s.constellations);
  const dsoObjects = useCatalogStore((s) => s.dsoObjects);

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

  const planets = useMemo(
    () => calculatePlanetPositions(observer, simulationTime),
    [observer, simulationTime]
  );

  const constellations = useMemo(
    () =>
      getConstellationObjects(
        buildConstellationCatalog(stars, skyConstellations),
        observer,
        simulationTime
      ),
    [observer, simulationTime, skyConstellations, stars]
  );

  const results = useMemo<CelestialObject[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    // Search stars
    const starResults: CelestialObject[] = stars
      .filter((s) => s.name && s.name.toLowerCase().includes(q))
      .slice(0, 8)
      .map((s) => {
        const hz = equatorialToHorizontal(s.ra, s.dec, observer, simulationTime);
        return {
          id: `star-${s.hip}`,
          name: s.name!,
          type: 'star',
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
    const planetResults: CelestialObject[] = planets
      .filter((p) => p.name.toLowerCase().includes(q))
      .map((p) => ({
        id: `planet-${p.name.toLowerCase()}`,
        name: p.name,
        type: getPlanetResultType(p.name),
        ra: p.ra,
        dec: p.dec,
        azimuth: p.azimuth,
        altitude: p.altitude,
        magnitude: p.magnitude,
        distance: `${p.distance.toFixed(3)} AU`,
      }));

    const constellationResults = constellations.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.constellation?.toLowerCase().includes(q)
    );

    // Search DSO objects (Messier, NGC, IC)
    const dsoResults: CelestialObject[] = dsoObjects
      .filter((dso) => {
        const searchName = dso.displayName.toLowerCase();
        const commonName = dso.commonName?.toLowerCase() || '';
        const ngcName = dso.name.toLowerCase();
        // Support M31, NGC224, Andromeda searches
        return searchName.includes(q) || 
               commonName.includes(q) || 
               ngcName.includes(q) ||
               (q.startsWith('m') && dso.messier?.toString() === q.slice(1));
      })
      .slice(0, 8)
      .map((dso) => {
        const hz = equatorialToHorizontal(dso.ra, dso.dec, observer, simulationTime);
        return {
          id: `dso-${dso.id}`,
          name: dso.commonName ? `${dso.displayName} (${dso.commonName.split(',')[0]})` : dso.displayName,
          type: 'dso' as const,
          ra: dso.ra,
          dec: dso.dec,
          azimuth: hz.azimuth,
          altitude: hz.altitude,
          magnitude: dso.mag ?? undefined,
          constellation: dso.constellation || undefined,
        };
      });

    return [...planetResults, ...dsoResults, ...starResults, ...constellationResults].slice(0, 12);
  }, [constellations, dsoObjects, observer, planets, query, simulationTime, stars]);

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
      .slice(0, 3)
      .map((s) => s.name!);
    // Add famous DSO objects
    return [...bright, 'M31', 'M42', 'M45', 'Jupiter', 'Moon'];
  }, [stars]);

  const getObjectTypeLabel = (object: CelestialObject) => {
    switch (object.type) {
      case 'star':
        return 'Star';
      case 'moon':
        return 'Moon';
      case 'sun':
        return 'Sun';
      case 'constellation':
        return 'Constellation';
      case 'dso':
        return 'Deep Sky Object';
      default:
        return 'Planet';
    }
  };

  const getDSOIcon = (name: string) => {
    // Determine icon based on object name/type hints
    const lowerName = name.toLowerCase();
    if (lowerName.includes('galaxy') || lowerName.includes('andromeda')) return <GalaxyIcon />;
    if (lowerName.includes('nebula') || lowerName.includes('orion')) return <NebulaIcon />;
    if (lowerName.includes('cluster') || lowerName.includes('pleiades')) return <ClusterIcon />;
    return <NebulaIcon />;
  };

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
                      {obj.type === 'star' ? (
                        <StarIcon />
                      ) : obj.type === 'constellation' ? (
                        <ConstellationIcon />
                      ) : obj.type === 'dso' ? (
                        getDSOIcon(obj.name)
                      ) : (
                        <PlanetIcon />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ainos-text truncate">{obj.name}</div>
                      <div className="text-[11px] text-ainos-text-dim">
                        {getObjectTypeLabel(obj)}
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
