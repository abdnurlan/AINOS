import { create } from 'zustand';
import type { CelestialObject, ObserverLocation, AppSettings, DeviceStatus, LaserTarget } from '../types';
import { sanitizeCelestialObject } from '../utils/celestial';

interface AppState {
  // Selected object
  selectedObject: CelestialObject | null;
  setSelectedObject: (obj: CelestialObject | null) => void;

  // Observer location
  observer: ObserverLocation;
  setObserver: (loc: ObserverLocation) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // Device
  deviceStatus: DeviceStatus;
  setDeviceStatus: (status: DeviceStatus) => void;

  // UI state
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  infoPanelOpen: boolean;
  setInfoPanelOpen: (open: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Camera target
  cameraTarget: { ra: number; dec: number } | null;
  setCameraTarget: (target: { ra: number; dec: number } | null) => void;

  // Laser targeting
  laserTarget: LaserTarget | null;
  setLaserTarget: (target: LaserTarget | null) => void;
  setLaserOn: (laserOn: boolean) => void;
  clearLaserTarget: () => void;

  // Time simulation
  simulationTime: Date;
  setSimulationTime: (time: Date) => void;
  timeSpeed: number;
  setTimeSpeed: (speed: number) => void;
  isPlaying: boolean;
  togglePlaying: () => void;
  setPlaying: (playing: boolean) => void;

  // Visibility toggles
  showGround: boolean;
  setShowGround: (show: boolean) => void;
  showAtmosphere: boolean;
  setShowAtmosphere: (show: boolean) => void;
  showCardinalPoints: boolean;
  setShowCardinalPoints: (show: boolean) => void;

  // FOV and Camera Tracking
  currentFov: number;
  setCurrentFov: (fov: number) => void;
  cameraAlt: number;
  cameraAz: number;
  setCameraPosition: (alt: number, az: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Selected object
  selectedObject: null,
  setSelectedObject: (obj) => {
    const sanitized = sanitizeCelestialObject(obj);
    if (obj && !sanitized) {
      console.warn('Ignoring invalid celestial selection:', obj);
    }
    set({ selectedObject: sanitized, infoPanelOpen: sanitized !== null });
  },

  // Default observer: Geneva, Switzerland
  observer: {
    latitude: 46.2044,
    longitude: 6.1432,
    elevation: 375,
  },
  setObserver: (loc) => set({ observer: loc }),

  // Settings
  settings: {
    showConstellationLines: true,
    showConstellationLabels: true,
    showStarLabels: true,
    showCoordinateGrid: false,
    showDSO: true,
    showDSOLabels: true,
    showNebulae: true,
    showGalaxies: true,
    showClusters: true,
    magnitudeFilter: 6.5,
    dsoMagnitudeFilter: 12.0,
    nightMode: false,
    hudTransparency: 0.85,
  },
  updateSettings: (partial) =>
    set((state) => ({ settings: { ...state.settings, ...partial } })),

  // Device status (initially disconnected)
  deviceStatus: {
    connected: false,
    battery: 0,
    gpsLat: 0,
    gpsLon: 0,
    gyroYaw: 0,
    gyroPitch: 0,
    laserOn: false,
  },
  setDeviceStatus: (status) => set({ deviceStatus: status }),

  // UI state
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  infoPanelOpen: false,
  setInfoPanelOpen: (open) => set({ infoPanelOpen: open }),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Camera target
  cameraTarget: null,
  setCameraTarget: (target) => set({ cameraTarget: target }),

  // Laser targeting - don't auto-enable laser, just set target
  laserTarget: null,
  setLaserTarget: (target) =>
    set({ laserTarget: target }),
  setLaserOn: (laserOn) =>
    set((state) => ({
      deviceStatus: { ...state.deviceStatus, laserOn },
    })),
  clearLaserTarget: () =>
    set((state) => ({
      laserTarget: null,
      deviceStatus: { ...state.deviceStatus, laserOn: false },
    })),

  // Time simulation
  simulationTime: new Date(),
  setSimulationTime: (time) => set({ simulationTime: time }),
  timeSpeed: 1,
  setTimeSpeed: (speed) => set({ timeSpeed: speed }),
  isPlaying: true,
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),

  // Visibility toggles
  showGround: true,
  setShowGround: (show) => set({ showGround: show }),
  showAtmosphere: true,
  setShowAtmosphere: (show) => set({ showAtmosphere: show }),
  showCardinalPoints: true,
  setShowCardinalPoints: (show) => set({ showCardinalPoints: show }),

  // FOV and Camera Tracking
  currentFov: 75,
  setCurrentFov: (fov) => set({ currentFov: fov }),
  cameraAlt: 0,
  cameraAz: 0,
  setCameraPosition: (alt, az) => set({ cameraAlt: alt, cameraAz: az }),
}));
