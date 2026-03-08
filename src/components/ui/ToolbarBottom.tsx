import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { turnOffLaser } from '../../api/laser';

/**
 * Stellarium-style bottom toolbar with icon toggle buttons
 * for controlling sky display features.
 */

// SVG Icon components
const ConstellationLinesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="4" cy="4" r="1.5" fill="currentColor" />
    <circle cx="20" cy="6" r="1.5" fill="currentColor" />
    <circle cx="12" cy="20" r="1.5" fill="currentColor" />
    <line x1="4" y1="4" x2="20" y2="6" />
    <line x1="20" y1="6" x2="12" y2="20" />
    <line x1="12" y1="20" x2="4" y2="4" />
  </svg>
);

const ConstellationLabelsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 7l6-4 6 4" />
    <circle cx="3" cy="7" r="1" fill="currentColor" />
    <circle cx="9" cy="3" r="1" fill="currentColor" />
    <circle cx="15" cy="7" r="1" fill="currentColor" />
    <text x="7" y="17" fontSize="8" fill="currentColor" fontFamily="sans-serif">Aa</text>
  </svg>
);

const StarLabelsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" fill="currentColor" opacity="0.4" />
    <text x="4" y="22" fontSize="8" fill="currentColor" fontFamily="sans-serif">α</text>
  </svg>
);

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
    <circle cx="12" cy="12" r="10" />
    <ellipse cx="12" cy="12" rx="4" ry="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
);

const GroundIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 16l4-3 4 2 4-4 4 2 4-3" />
    <rect x="2" y="16" width="20" height="6" fill="currentColor" opacity="0.2" />
    <line x1="2" y1="16" x2="22" y2="16" />
  </svg>
);

const AtmosphereIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 18 Q12 8, 22 18" />
    <path d="M4 18 Q12 11, 20 18" opacity="0.5" />
    <path d="M6 18 Q12 14, 18 18" opacity="0.3" />
  </svg>
);

const CardinalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="3" x2="12" y2="7" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <line x1="3" y1="12" x2="7" y2="12" />
    <line x1="17" y1="12" x2="21" y2="12" />
    <text x="10" y="7" fontSize="5" fill="currentColor" fontFamily="sans-serif">N</text>
  </svg>
);

const NightModeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" opacity="0.2" />
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const DSOIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <ellipse cx="12" cy="12" rx="9" ry="5" opacity="0.3" fill="currentColor" />
    <ellipse cx="12" cy="12" rx="6" ry="3" opacity="0.5" fill="currentColor" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const LaserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="7" cy="17" r="2.2" />
    <path d="M9 15 20 4" />
    <path d="M16.5 4H20v3.5" />
    <circle cx="20" cy="4" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

interface ToolbarButton {
  id: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  shortcut?: string;
}

export default function ToolbarBottom() {
  const [laserBusy, setLaserBusy] = useState(false);
  const {
    settings,
    updateSettings,
    showGround,
    setShowGround,
    showAtmosphere,
    setShowAtmosphere,
    showCardinalPoints,
    setShowCardinalPoints,
    currentFov,
    laserTarget,
    clearLaserTarget,
    deviceStatus,
  } = useAppStore();

  const handleLaserToggle = useCallback(async () => {
    if (!deviceStatus.laserOn || laserBusy) {
      return;
    }

    setLaserBusy(true);
    try {
      await turnOffLaser();
      clearLaserTarget();
    } catch (error) {
      console.error('Failed to turn laser off:', error);
    } finally {
      setLaserBusy(false);
    }
  }, [clearLaserTarget, deviceStatus.laserOn, laserBusy]);

  const buttons: ToolbarButton[] = [
    {
      id: 'constellation-lines',
      icon: <ConstellationLinesIcon />,
      label: 'Constellation Lines',
      active: settings.showConstellationLines,
      onClick: () => updateSettings({ showConstellationLines: !settings.showConstellationLines }),
      shortcut: 'C',
    },
    {
      id: 'constellation-labels',
      icon: <ConstellationLabelsIcon />,
      label: 'Constellation Labels',
      active: settings.showConstellationLabels,
      onClick: () => updateSettings({ showConstellationLabels: !settings.showConstellationLabels }),
      shortcut: 'V',
    },
    {
      id: 'star-labels',
      icon: <StarLabelsIcon />,
      label: 'Star Names',
      active: settings.showStarLabels,
      onClick: () => updateSettings({ showStarLabels: !settings.showStarLabels }),
    },
    {
      id: 'dso',
      icon: <DSOIcon />,
      label: 'Deep Sky Objects',
      active: settings.showDSO,
      onClick: () => updateSettings({ showDSO: !settings.showDSO }),
      shortcut: 'D',
    },
    {
      id: 'grid',
      icon: <GridIcon />,
      label: 'Equatorial Grid',
      active: settings.showCoordinateGrid,
      onClick: () => updateSettings({ showCoordinateGrid: !settings.showCoordinateGrid }),
      shortcut: 'E',
    },
    {
      id: 'ground',
      icon: <GroundIcon />,
      label: 'Ground',
      active: showGround,
      onClick: () => setShowGround(!showGround),
      shortcut: 'G',
    },
    {
      id: 'atmosphere',
      icon: <AtmosphereIcon />,
      label: 'Atmosphere',
      active: showAtmosphere,
      onClick: () => setShowAtmosphere(!showAtmosphere),
      shortcut: 'A',
    },
    {
      id: 'cardinal',
      icon: <CardinalIcon />,
      label: 'Cardinal Points',
      active: showCardinalPoints,
      onClick: () => setShowCardinalPoints(!showCardinalPoints),
      shortcut: 'Q',
    },
    {
      id: 'night-mode',
      icon: <NightModeIcon />,
      label: 'Night Mode',
      active: settings.nightMode,
      onClick: () => updateSettings({ nightMode: !settings.nightMode }),
      shortcut: 'N',
    },
    {
      id: 'laser',
      icon: <LaserIcon />,
      label: laserTarget ? 'Laser Target Active' : 'Laser Ready',
      active: deviceStatus.laserOn || laserBusy,
      onClick: handleLaserToggle,
      shortcut: 'R',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 pointer-events-auto"
    >
      <div className="glass-panel-compact px-2 py-1.5 flex items-center gap-0.5">
        {buttons.map((btn) => (
          <button
            key={btn.id}
            onClick={btn.onClick}
            className={`relative p-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${
              btn.active
                ? 'text-ainos-accent bg-ainos-accent/10'
                : 'text-ainos-text-dim hover:text-ainos-text hover:bg-white/5'
            }`}
            title={`${btn.label}${btn.shortcut ? ` (${btn.shortcut})` : ''}`}
          >
            {btn.icon}
            {/* Active indicator dot */}
            {btn.active && (
              <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ainos-accent" />
            )}
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-7 bg-white/10 mx-1" />

        {/* FOV indicator */}
        <div className="px-2 py-1 flex flex-col items-center">
          <span className="text-[9px] text-ainos-text-muted uppercase tracking-wider">FOV</span>
          <span className="font-mono text-[11px] text-ainos-text">{currentFov}°</span>
        </div>
      </div>
    </motion.div>
  );
}
