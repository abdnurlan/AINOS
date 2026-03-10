import { useEffect } from 'react';
import SkyScene from './components/sky/SkyScene';
import SearchPanel from './components/ui/SearchPanel';
import ObjectInfoPanel from './components/ui/ObjectInfoPanel';
import SettingsPanel from './components/ui/SettingsPanel';
import StatusBar from './components/ui/StatusBar';
import TimeController from './components/ui/TimeController';
import ToolbarBottom from './components/ui/ToolbarBottom';
import { useAppStore } from './store/useAppStore';
import { useCatalogStore } from './store/useCatalogStore';

export default function App() {
  const nightMode = useAppStore((s) => s.settings.nightMode);
  const hudTransparency = useAppStore((s) => s.settings.hudTransparency);
  const loadCatalogs = useCatalogStore((s) => s.loadCatalogs);
  const setObserver = useAppStore((s) => s.setObserver);

  useEffect(() => {
    void loadCatalogs();
  }, [loadCatalogs]);

  // Real GPS from browser
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported — using default location');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setObserver({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          elevation: position.coords.altitude ?? 28,
        });
        console.log(
          `📍 GPS: ${position.coords.latitude.toFixed(4)}°, ${position.coords.longitude.toFixed(4)}°`
        );
      },
      (error) => {
        console.warn('GPS unavailable, using default Baku location:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [setObserver]);

  return (
    <div className={`w-screen h-screen relative overflow-hidden ${nightMode ? 'night-mode-filter' : ''}`}>
      {/* 3D Sky — full viewport, z-0 to be below UI */}
      <div className="absolute inset-0 z-0">
        <SkyScene />
      </div>

      {/* HUD overlay layer - pointer-events-none allows clicks to pass through to Canvas */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ opacity: hudTransparency }}
      >
        {/* UI panels */}
        <SearchPanel />
        <ObjectInfoPanel />
        <SettingsPanel />

        {/* Time controller — bottom left */}
        <TimeController />

        {/* Bottom toolbar — center */}
        <ToolbarBottom />

        {/* Status bar */}
        <StatusBar />

        {/* Branding — bottom center, above toolbar */}
        <div className="fixed bottom-[88px] left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
          <div className="text-[16px] font-light tracking-[0.4em] text-ainos-text/10
                        bg-gradient-to-r from-transparent via-ainos-accent/10 to-transparent
                        bg-clip-text [-webkit-background-clip:text]">
            A I N O S
          </div>
        </div>
      </div>
    </div>
  );
}
