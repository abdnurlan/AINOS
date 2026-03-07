import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

export default function StatusBar() {
  const { observer, selectedObject, deviceStatus } = useAppStore();
  const [utcTime, setUtcTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setUtcTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d: Date) => {
    return d.toISOString().replace('T', '  ').substring(0, 21) + ' UTC';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-9 flex items-center justify-between 
                    px-5 text-[11px] font-mono
                    bg-gradient-to-t from-black/50 to-transparent
                    border-t border-white/5 pointer-events-auto"
    >
      {/* Left — Location & Time */}
      <div className="flex items-center gap-5 text-ainos-text-dim">
        <span className="flex items-center gap-1.5">
          <span className="text-ainos-accent">◎</span>
          {observer.latitude.toFixed(4)}°N {observer.longitude.toFixed(4)}°E
        </span>
        <span className="text-ainos-text-muted">|</span>
        <span>{formatTime(utcTime)}</span>
      </div>

      {/* Center — Selected Object */}
      {selectedObject && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-ainos-text-dim">
          <span className={`w-1.5 h-1.5 rounded-full ${
            selectedObject.altitude && selectedObject.altitude > 0 ? 'bg-ainos-success' : 'bg-ainos-danger'
          }`} />
          <span className="text-ainos-text font-medium">{selectedObject.name}</span>
          {selectedObject.altitude !== undefined && (
            <span className="text-ainos-text-muted">
              Alt: {selectedObject.altitude.toFixed(1)}°
            </span>
          )}
        </div>
      )}

      {/* Right — Device Status */}
      <div className="flex items-center gap-2 text-ainos-text-dim">
        <span className={`w-1.5 h-1.5 rounded-full ${
          deviceStatus.connected ? 'bg-ainos-success' : 'bg-ainos-text-muted'
        }`} />
        <span>
          {deviceStatus.connected ? `Device  ${deviceStatus.battery}%` : '~ No Device'}
        </span>
      </div>
    </div>
  );
}
