import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { formatRA, formatDec } from '../../utils/astronomy';
import { pointLaser } from '../../api/laser';
import { resolveCelestialObject } from '../../utils/catalog';
import { hasFiniteCelestialCoordinates } from '../../utils/celestial';

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



function getTypeIcon(type: string) {
  switch (type) {
    case 'star': return 'STAR';
    case 'planet': return 'PLANET';
    case 'moon': return 'MOON';
    case 'sun': return 'SUN';
    case 'dso': return 'DSO';
    case 'constellation': return 'CONST';
    default: return 'OBJ';
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'star': return 'Star';
    case 'planet': return 'Planet';
    case 'moon': return 'Moon';
    case 'sun': return 'Sun';
    case 'dso': return 'Deep Sky Object';
    case 'constellation': return 'Constellation';
    default: return type;
  }
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

function ObjectInfoCard() {
  const selectedObject = useAppStore((s) => s.selectedObject);
  const setSelectedObject = useAppStore((s) => s.setSelectedObject);
  const setInfoPanelOpen = useAppStore((s) => s.setInfoPanelOpen);
  const observer = useAppStore((s) => s.observer);
  const simulationTime = useAppStore((s) => s.simulationTime);
  const setLaserTarget = useAppStore((s) => s.setLaserTarget);
  const setLaserOn = useAppStore((s) => s.setLaserOn);
  const [laserBusy, setLaserBusy] = useState(false);
  const [laserFeedback, setLaserFeedback] = useState<string | null>(null);
  const [laserError, setLaserError] = useState<string | null>(null);

  const currentObject = useMemo(() => {
    if (!selectedObject) return null;
    return resolveCelestialObject(selectedObject, observer, simulationTime);
  }, [observer, selectedObject, simulationTime]);

  useEffect(() => {
    setLaserBusy(false);
    setLaserFeedback(null);
    setLaserError(null);
  }, [currentObject?.id, currentObject?.ra, currentObject?.dec]);

  const handleClose = useCallback(() => {
    setSelectedObject(null);
    setInfoPanelOpen(false);
  }, [setInfoPanelOpen, setSelectedObject]);



  const handlePointLaser = useCallback(async () => {
    if (!currentObject) {
      setLaserError('No target selected.');
      return;
    }

    if (!hasFiniteCelestialCoordinates(currentObject)) {
      setLaserError('Target coordinates are invalid.');
      return;
    }

    if (currentObject.altitude === undefined || currentObject.altitude <= 0) {
      setLaserError('Object is below the horizon.');
      return;
    }

    setLaserBusy(true);
    setLaserError(null);
    setLaserFeedback(null);

    try {
      const observer = useAppStore.getState().observer;
      const result = await pointLaser({
        ra: currentObject.ra,
        dec: currentObject.dec,
        altitude: currentObject.altitude,
        azimuth: currentObject.azimuth,
        observerLat: observer.latitude,
        observerLon: observer.longitude,
        objectName: currentObject.name,
        objectType: currentObject.type,
      });

      setLaserTarget({ ra: currentObject.ra, dec: currentObject.dec });
      setLaserOn(result.active);
      // Show frontend-calculated Alt/Az (matches panel) instead of backend's
      const feedbackAlt = currentObject.altitude?.toFixed(2) ?? result.altitude?.toFixed(2);
      const feedbackAz = currentObject.azimuth?.toFixed(2) ?? result.azimuth?.toFixed(2);
      setLaserFeedback(
        feedbackAlt && feedbackAz
          ? `Laser aligned: Alt ${feedbackAlt}° · Az ${feedbackAz}°`
          : 'Laser command sent.'
      );
    } catch (error) {
      setLaserOn(false);
      setLaserError(error instanceof Error ? error.message : 'Laser command failed.');
      console.error('Failed to send laser command:', error);
    } finally {
      setLaserBusy(false);
    }
  }, [currentObject, setLaserOn, setLaserTarget]);

  if (!currentObject) {
    return null;
  }

  const isAboveHorizon = currentObject.altitude !== undefined && currentObject.altitude > 0;
  const canPointLaser = isAboveHorizon && hasFiniteCelestialCoordinates(currentObject) && !laserBusy;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed right-5 top-5 z-50 w-80 glass-panel overflow-hidden pointer-events-auto"
    >
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-ainos-accent to-transparent opacity-60" />
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isAboveHorizon ? 'bg-ainos-success animate-pulse-glow' : 'bg-ainos-text-dim'}`} />
            <div>
              <h3 className="text-base font-semibold text-ainos-text tracking-wide">{currentObject.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] uppercase tracking-wider font-medium text-ainos-accent">
                  {getTypeIcon(currentObject.type)} {getTypeLabel(currentObject.type)}
                </span>
                {currentObject.constellation && (
                  <span className="text-[10px] text-ainos-text-dim">· {currentObject.constellation}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-ainos-text-dim hover:text-ainos-text transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/5"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className="px-5 py-3 space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-ainos-text-muted font-medium mb-2">
          Equatorial
        </div>
        <DataRow label="Right Ascension" value={formatRA(currentObject.ra)} />
        <DataRow label="Declination" value={formatDec(currentObject.dec)} />
      </div>

      {currentObject.azimuth !== undefined && currentObject.altitude !== undefined && (
        <div className="px-5 py-3 border-t border-ainos-panel-border space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-ainos-text-muted font-medium mb-2">
            Horizontal
          </div>
          <DataRow label="Azimuth" value={`${currentObject.azimuth.toFixed(2)}°`} />
          <DataRow
            label="Altitude"
            value={`${currentObject.altitude.toFixed(2)}°`}
            valueClass={isAboveHorizon ? 'text-ainos-success' : 'text-ainos-danger'}
          />
        </div>
      )}

      <div className="px-5 py-3 border-t border-ainos-panel-border space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-ainos-text-muted font-medium mb-2">
          Properties
        </div>
        {currentObject.magnitude !== undefined && (
          <DataRow label="Magnitude" value={currentObject.magnitude.toFixed(2)} />
        )}
        {currentObject.spectral && (
          <DataRow label="Spectral Type" value={currentObject.spectral} />
        )}
        {currentObject.distance && (
          <DataRow label="Distance" value={currentObject.distance} />
        )}
      </div>

      <div className="px-5 py-4 border-t border-ainos-panel-border">
        <button
          onClick={handlePointLaser}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
          title={canPointLaser ? 'Point laser at this object' : 'Laser is unavailable for this target'}
          disabled={!canPointLaser}
        >
          <CrosshairIcon />
          {laserBusy ? 'Pointing...' : 'Point Laser'}
        </button>
      </div>

      {(laserFeedback || laserError) && (
        <div className="px-5 pb-4">
          <div
            className={`text-[11px] rounded-lg px-3 py-2 border ${
              laserError
                ? 'text-ainos-danger bg-ainos-danger/8 border-ainos-danger/15'
                : 'text-ainos-success bg-ainos-success/8 border-ainos-success/15'
            }`}
          >
            {laserError ?? laserFeedback}
          </div>
        </div>
      )}

      {!isAboveHorizon && (
        <div className="px-5 pb-4">
          <div className="text-[11px] text-ainos-danger bg-ainos-danger/8 rounded-lg px-3 py-2 border border-ainos-danger/15">
            Object is below the horizon. Laser pointing unavailable.
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function ObjectInfoPanel() {
  const infoPanelOpen = useAppStore((s) => s.infoPanelOpen);

  return (
    <AnimatePresence>
      {infoPanelOpen ? <ObjectInfoCard key="object-info-card" /> : null}
    </AnimatePresence>
  );
}
