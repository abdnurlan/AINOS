import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

/**
 * Stellarium-style time controller with play/pause, speed controls,
 * and date/time display.
 */

const TIME_SPEEDS = [
  { label: '-1000x', value: -1000 },
  { label: '-100x', value: -100 },
  { label: '-10x', value: -10 },
  { label: '-1x', value: -1 },
  { label: '1x', value: 1 },
  { label: '10x', value: 10 },
  { label: '100x', value: 100 },
  { label: '1000x', value: 1000 },
];

// SVG Icons
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const RewindIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="11,3 1,12 11,21" />
    <polygon points="23,3 13,12 23,21" />
  </svg>
);

const ForwardIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="1,3 11,12 1,21" />
    <polygon points="13,3 23,12 13,21" />
  </svg>
);

const NowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function TimeController() {
  const {
    simulationTime,
    setSimulationTime,
    timeSpeed,
    setTimeSpeed,
    isPlaying,
    togglePlaying,
    setPlaying,
  } = useAppStore();

  const [displayTime, setDisplayTime] = useState(simulationTime);

  // Update display every 100ms
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayTime(useAppStore.getState().simulationTime);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const handleNow = useCallback(() => {
    setSimulationTime(new Date());
    setTimeSpeed(1);
    setPlaying(true);
  }, [setSimulationTime, setTimeSpeed, setPlaying]);

  const handleSlower = useCallback(() => {
    const idx = TIME_SPEEDS.findIndex((s) => s.value === timeSpeed);
    if (idx > 0) setTimeSpeed(TIME_SPEEDS[idx - 1].value);
  }, [timeSpeed, setTimeSpeed]);

  const handleFaster = useCallback(() => {
    const idx = TIME_SPEEDS.findIndex((s) => s.value === timeSpeed);
    if (idx < TIME_SPEEDS.length - 1) setTimeSpeed(TIME_SPEEDS[idx + 1].value);
  }, [timeSpeed, setTimeSpeed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlaying();
          break;
        case 'j':
        case 'J':
          handleSlower();
          break;
        case 'l':
        case 'L':
          handleFaster();
          break;
        case 'k':
        case 'K':
          handleNow();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlaying, handleSlower, handleFaster, handleNow]);

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (d: Date) => {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const speedLabel = TIME_SPEEDS.find((s) => s.value === timeSpeed)?.label || `${timeSpeed}x`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="fixed bottom-12 left-5 z-40 pointer-events-auto"
    >
      <div className="glass-panel-compact px-4 py-2.5 flex items-center gap-3">
        {/* Date/Time display */}
        <div className="flex flex-col items-end mr-2">
          <span className="font-mono text-[11px] text-ainos-text tracking-wider">
            {formatDate(displayTime)}
          </span>
          <span className="font-mono text-[13px] text-ainos-accent font-medium tracking-wider">
            {formatTime(displayTime)}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/10" />

        {/* Transport controls */}
        <div className="flex items-center gap-1">
          {/* Rewind */}
          <button
            onClick={handleSlower}
            className="p-1.5 text-ainos-text-dim hover:text-ainos-text 
                     hover:bg-white/5 rounded-md transition-all cursor-pointer"
            title="Slower (J)"
          >
            <RewindIcon />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlaying}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              isPlaying
                ? 'text-ainos-accent bg-ainos-accent/10 hover:bg-ainos-accent/20'
                : 'text-ainos-text-dim hover:text-ainos-text hover:bg-white/5'
            }`}
            title="Play/Pause (Space)"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          {/* Forward */}
          <button
            onClick={handleFaster}
            className="p-1.5 text-ainos-text-dim hover:text-ainos-text 
                     hover:bg-white/5 rounded-md transition-all cursor-pointer"
            title="Faster (L)"
          >
            <ForwardIcon />
          </button>

          {/* Now */}
          <button
            onClick={handleNow}
            className="p-1.5 text-ainos-text-dim hover:text-ainos-text 
                     hover:bg-white/5 rounded-md transition-all cursor-pointer ml-1"
            title="Jump to Now (K)"
          >
            <NowIcon />
          </button>
        </div>

        {/* Speed indicator */}
        <div className="w-px h-8 bg-white/10" />
        <span className={`font-mono text-[10px] min-w-[40px] text-center ${
          timeSpeed !== 1 ? 'text-ainos-warning' : 'text-ainos-text-muted'
        }`}>
          {speedLabel}
        </span>
      </div>
    </motion.div>
  );
}
