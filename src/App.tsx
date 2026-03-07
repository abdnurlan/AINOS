import SkyScene from './components/sky/SkyScene';
import SearchPanel from './components/ui/SearchPanel';
import ObjectInfoPanel from './components/ui/ObjectInfoPanel';
import SettingsPanel from './components/ui/SettingsPanel';
import StatusBar from './components/ui/StatusBar';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const nightMode = useAppStore((s) => s.settings.nightMode);
  const hudTransparency = useAppStore((s) => s.settings.hudTransparency);

  return (
    <div className={`w-screen h-screen relative overflow-hidden ${nightMode ? 'night-mode-filter' : ''}`}>
      {/* 3D Sky — full viewport */}
      <SkyScene />

      {/* HUD overlay layer */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ opacity: hudTransparency }}
      >
        {/* UI panels */}
        <SearchPanel />
        <ObjectInfoPanel />
        <SettingsPanel />

        {/* Status bar */}
        <StatusBar />

        {/* Branding — bottom center */}
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
          <div className="text-[20px] font-light tracking-[0.4em] text-ainos-text/20
                        bg-gradient-to-r from-transparent via-ainos-accent/15 to-transparent
                        bg-clip-text [-webkit-background-clip:text]">
            A I N O S
          </div>
          <div className="text-[8px] tracking-[0.25em] text-ainos-text-muted/30 mt-0.5 uppercase">
            Astronomical Laser Pointing System
          </div>
        </div>
      </div>
    </div>
  );
}
