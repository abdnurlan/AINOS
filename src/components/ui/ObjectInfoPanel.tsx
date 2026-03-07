import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { formatRA, formatDec } from '../../utils/astronomy';

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const CrosshairIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M22 12h-4M6 12H2M12 6V2M12 22v-4" />
  </svg>
);

const TrackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export default function ObjectInfoPanel() {
  const { selectedObject, setSelectedObject, infoPanelOpen, setInfoPanelOpen } = useAppStore();

  if (!selectedObject) return null;

  const handleClose = () => {
    setSelectedObject(null);
    setInfoPanelOpen(false);
  };

  const isAboveHorizon = selectedObject.altitude !== undefined && selectedObject.altitude > 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'star': return '⭐';
      case 'planet': return '🪐';
      case 'moon': return '🌙';
      case 'sun': return '☀️';
      default: return '✦';
    }
  };

  return (
    <AnimatePresence>
      {infoPanelOpen && (
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.96 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed right-5 top-5 z-50 w-80 glass-panel overflow-hidden pointer-events-auto"
        >
          {/* Header with accent line */}
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-ainos-accent to-transparent opacity-60" />
            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${isAboveHorizon ? 'bg-ainos-success animate-pulse-glow' : 'bg-ainos-text-dim'}`} />
                <div>
                  <h3 className="text-base font-semibold text-ainos-text tracking-wide">{selectedObject.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase tracking-wider font-medium text-ainos-accent">
                      {getTypeIcon(selectedObject.type)} {selectedObject.type}
                    </span>
                    {selectedObject.constellation && (
                      <span className="text-[10px] text-ainos-text-dim">· {selectedObject.constellation}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-ainos-text-dim hover:text-ainos-text transition-colors cursor-pointer p-1.5 
                         rounded-lg hover:bg-white/5"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Equatorial section */}
          <div className="px-5 py-3 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-ainos-text-muted font-medium mb-2">
              Equatorial
            </div>
            <DataRow label="Right Ascension" value={formatRA(selectedObject.ra)} />
            <DataRow label="Declination" value={formatDec(selectedObject.dec)} />
          </div>

          {/* Horizontal section */}
          {selectedObject.azimuth !== undefined && selectedObject.altitude !== undefined && (
            <div className="px-5 py-3 border-t border-ainos-panel-border space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-ainos-text-muted font-medium mb-2">
                Horizontal
              </div>
              <DataRow label="Azimuth" value={`${selectedObject.azimuth.toFixed(2)}°`} />
              <DataRow
                label="Altitude"
                value={`${selectedObject.altitude.toFixed(2)}°`}
                valueClass={isAboveHorizon ? 'text-ainos-success' : 'text-ainos-danger'}
              />
            </div>
          )}

          {/* Properties */}
          <div className="px-5 py-3 border-t border-ainos-panel-border space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-ainos-text-muted font-medium mb-2">
              Properties
            </div>
            {selectedObject.magnitude !== undefined && (
              <DataRow label="Magnitude" value={selectedObject.magnitude.toFixed(2)} />
            )}
            {selectedObject.spectral && (
              <DataRow label="Spectral Type" value={selectedObject.spectral} />
            )}
            {selectedObject.distance && (
              <DataRow label="Distance" value={selectedObject.distance} />
            )}
          </div>

          {/* Action buttons */}
          <div className="px-5 py-4 border-t border-ainos-panel-border flex gap-2">
            <button className="btn-primary flex-1" title="Point laser at this object">
              <CrosshairIcon />
              Point Laser
            </button>
            <button className="btn-secondary flex-1 flex items-center justify-center gap-1.5" title="Track this object">
              <TrackIcon />
              Track
            </button>
          </div>

          {/* Below horizon warning */}
          {!isAboveHorizon && (
            <div className="px-5 pb-4">
              <div className="text-[11px] text-ainos-danger bg-ainos-danger/8 rounded-lg px-3 py-2 border border-ainos-danger/15">
                ⚠ Object is below the horizon — laser pointing unavailable
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DataRow({
  label,
  value,
  valueClass = 'text-ainos-text',
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[12px] text-ainos-text-dim">{label}</span>
      <span className={`font-mono text-[12px] ${valueClass}`}>{value}</span>
    </div>
  );
}
