import { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { resolveCelestialObject } from '../../utils/catalog';

export default function StatusBar() {
  const { observer, selectedObject, deviceStatus, simulationTime, currentFov, cameraAlt, cameraAz } = useAppStore();
  const [displayTime, setDisplayTime] = useState(simulationTime);

  const currentObject = useMemo(() => {
    if (!selectedObject) return null;
    return resolveCelestialObject(selectedObject, observer, simulationTime);
  }, [observer, selectedObject, simulationTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayTime(useAppStore.getState().simulationTime);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d: Date) => {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const latSuffix = observer.latitude >= 0 ? 'N' : 'S';
  const lonSuffix = observer.longitude >= 0 ? 'E' : 'W';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-9 flex items-center justify-between 
                    px-5 text-[11px] font-mono
                    bg-gradient-to-t from-black/50 to-transparent
                    border-t border-white/5 pointer-events-auto"
    >
      {/* Left — Location */}
      <div className="flex items-center gap-5 text-ainos-text-dim">
        <span className="flex items-center gap-1.5">
          <span className="text-ainos-accent">◎</span>
          {Math.abs(observer.latitude).toFixed(4)}°{latSuffix} {Math.abs(observer.longitude).toFixed(4)}°{lonSuffix}
        </span>
        <span className="text-ainos-text-muted">|</span>
        <span>{formatTime(displayTime)} LT</span>
      </div>

      {/* Center — Selected Object */}
      {currentObject && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-ainos-text-dim">
          <span className={`w-1.5 h-1.5 rounded-full ${
            currentObject.altitude !== undefined && currentObject.altitude > 0 ? 'bg-ainos-success' : 'bg-ainos-danger'
          }`} />
          <span className="text-ainos-text font-medium">{currentObject.name}</span>
          {currentObject.altitude !== undefined && (
            <span className="text-ainos-text-muted">
              Alt: {currentObject.altitude.toFixed(1)}°
            </span>
          )}
        </div>
      )}

      {/* Right — Camera Tracking + Device Status + FOV */}
      <div className="flex items-center gap-4 text-ainos-text-dim">
        <div className="flex gap-2.5 text-[10px] text-ainos-text-muted mr-1">
          <span>ALT: <span className="text-ainos-text-dim">{cameraAlt.toFixed(1)}°</span></span>
          <span>AZ: <span className="text-ainos-text-dim">{cameraAz.toFixed(1)}°</span></span>
        </div>
        <span className="text-ainos-text-muted w-14">FOV: {currentFov}°</span>
        <span className={`w-1.5 h-1.5 rounded-full ${
          deviceStatus.connected ? 'bg-ainos-success' : 'bg-ainos-text-muted'
        }`} />
        <span>
          {deviceStatus.connected ? `Device  ${deviceStatus.battery}%` : '~ No Device'}
        </span>
        <span className={deviceStatus.laserOn ? 'text-ainos-danger' : 'text-ainos-text-muted'}>
          {deviceStatus.laserOn ? 'LASER ON' : 'LASER OFF'}
        </span>
      </div>
    </div>
  );
}
