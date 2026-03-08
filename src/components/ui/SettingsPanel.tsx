import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export default function SettingsPanel() {
  const { settingsOpen, setSettingsOpen, settings, updateSettings } = useAppStore();

  return (
    <>
      {/* Settings trigger */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="fixed top-5 right-5 z-40 glass-panel p-2.5 text-ainos-text-dim 
                   hover:text-ainos-text cursor-pointer glow-hover transition-all duration-300 pointer-events-auto"
        onClick={() => setSettingsOpen(!settingsOpen)}
      >
        <GearIcon />
      </motion.button>

      {/* Settings panel */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed right-5 top-16 z-50 w-72 glass-panel overflow-hidden pointer-events-auto"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-ainos-panel-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ainos-text">Display Settings</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-ainos-text-dim hover:text-ainos-text transition-colors cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Stars Section */}
              <div className="text-[10px] uppercase tracking-wider text-ainos-accent font-semibold mb-2">
                Stars
              </div>
              <ToggleSetting
                label="Star Labels"
                checked={settings.showStarLabels}
                onChange={(v) => updateSettings({ showStarLabels: v })}
              />
              <SliderSetting
                label="Star Magnitude Limit"
                value={settings.magnitudeFilter}
                min={1}
                max={8}
                step={0.5}
                onChange={(v) => updateSettings({ magnitudeFilter: v })}
                formatValue={(v) => `≤ ${v.toFixed(1)}`}
              />

              {/* Constellations Section */}
              <div className="border-t border-ainos-panel-border pt-4">
                <div className="text-[10px] uppercase tracking-wider text-ainos-accent font-semibold mb-2">
                  Constellations
                </div>
                <ToggleSetting
                  label="Constellation Lines"
                  checked={settings.showConstellationLines}
                  onChange={(v) => updateSettings({ showConstellationLines: v })}
                />
                <div className="mt-3">
                  <ToggleSetting
                    label="Constellation Labels"
                    checked={settings.showConstellationLabels}
                    onChange={(v) => updateSettings({ showConstellationLabels: v })}
                  />
                </div>
              </div>

              {/* Deep Sky Objects Section */}
              <div className="border-t border-ainos-panel-border pt-4">
                <div className="text-[10px] uppercase tracking-wider text-ainos-accent font-semibold mb-2">
                  Deep Sky Objects
                </div>
                <ToggleSetting
                  label="Show DSO"
                  checked={settings.showDSO}
                  onChange={(v) => updateSettings({ showDSO: v })}
                />
                <div className="mt-3">
                  <ToggleSetting
                    label="DSO Labels"
                    checked={settings.showDSOLabels}
                    onChange={(v) => updateSettings({ showDSOLabels: v })}
                  />
                </div>
                <div className="mt-3">
                  <ToggleSetting
                    label="Nebulae"
                    checked={settings.showNebulae}
                    onChange={(v) => updateSettings({ showNebulae: v })}
                  />
                </div>
                <div className="mt-3">
                  <ToggleSetting
                    label="Galaxies"
                    checked={settings.showGalaxies}
                    onChange={(v) => updateSettings({ showGalaxies: v })}
                  />
                </div>
                <div className="mt-3">
                  <ToggleSetting
                    label="Star Clusters"
                    checked={settings.showClusters}
                    onChange={(v) => updateSettings({ showClusters: v })}
                  />
                </div>
                <div className="mt-3">
                  <SliderSetting
                    label="DSO Magnitude Limit"
                    value={settings.dsoMagnitudeFilter}
                    min={6}
                    max={15}
                    step={0.5}
                    onChange={(v) => updateSettings({ dsoMagnitudeFilter: v })}
                    formatValue={(v) => `≤ ${v.toFixed(1)}`}
                  />
                </div>
              </div>

              {/* Grid & Markers Section */}
              <div className="border-t border-ainos-panel-border pt-4">
                <div className="text-[10px] uppercase tracking-wider text-ainos-accent font-semibold mb-2">
                  Grids & Markers
                </div>
                <ToggleSetting
                  label="Coordinate Grid"
                  checked={settings.showCoordinateGrid}
                  onChange={(v) => updateSettings({ showCoordinateGrid: v })}
                />
              </div>

              {/* Display Section */}
              <div className="border-t border-ainos-panel-border pt-4">
                <div className="text-[10px] uppercase tracking-wider text-ainos-accent font-semibold mb-2">
                  Display
                </div>
                <ToggleSetting
                  label="Night Mode"
                  checked={settings.nightMode}
                  onChange={(v) => updateSettings({ nightMode: v })}
                />
                <div className="mt-3">
                  <SliderSetting
                    label="HUD Transparency"
                    value={settings.hudTransparency}
                    min={0.3}
                    max={1}
                    step={0.05}
                    onChange={(v) => updateSettings({ hudTransparency: v })}
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ToggleSetting({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-ainos-text-dim group-hover:text-ainos-text transition-colors">
        {label}
      </span>
      <div
        className={`relative w-9 h-5 rounded-full transition-colors ${
          checked ? 'bg-ainos-accent' : 'bg-white/10'
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </div>
    </label>
  );
}

function SliderSetting({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue: (value: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-ainos-text-dim">{label}</span>
        <span className="text-xs font-mono text-ainos-text">{formatValue(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none bg-white/10 cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                   [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ainos-accent
                   [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}
