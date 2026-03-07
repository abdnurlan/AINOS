import { create } from 'zustand';
import type { CelestialObject, ObserverLocation, AppSettings, DeviceStatus } from '../types';

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
}

export const useAppStore = create<AppState>((set) => ({
  // Selected object
  selectedObject: null,
  setSelectedObject: (obj) => set({ selectedObject: obj, infoPanelOpen: obj !== null }),

  // Default observer: Baku, Azerbaijan
  observer: {
    latitude: 40.4093,
    longitude: 49.8671,
    elevation: 28,
  },
  setObserver: (loc) => set({ observer: loc }),

  // Settings
  settings: {
    showConstellationLines: true,
    showConstellationLabels: true,
    showStarLabels: true,
    showCoordinateGrid: false,
    magnitudeFilter: 6.5,
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
}));
