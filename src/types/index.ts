// ==============================
// AINOS Type Definitions
// ==============================

export interface Star {
  hip: number;
  name: string | null;
  ra: number;       // Right Ascension in degrees
  dec: number;      // Declination in degrees
  mag: number;      // Visual magnitude
  spectral: string; // Spectral type (O, B, A, F, G, K, M)
  constellation: string | null;
  bayer: string | null;
}

export interface Planet {
  name: string;
  ra: number;
  dec: number;
  azimuth: number;
  altitude: number;
  magnitude: number;
  distance: number;  // AU
  phase?: number;    // illumination fraction for Moon/planets
}

export interface ConstellationLine {
  from: number; // HIP ID
  to: number;   // HIP ID
}

export interface Constellation {
  name: string;
  abbr: string;
  lines: ConstellationLine[];
}

export type CelestialObjectType = 'star' | 'planet' | 'moon' | 'sun' | 'constellation';

export interface CelestialObject {
  id: string;
  name: string;
  type: CelestialObjectType;
  ra: number;
  dec: number;
  azimuth?: number;
  altitude?: number;
  magnitude?: number;
  distance?: string;
  constellation?: string;
  spectral?: string;
}

export interface ObserverLocation {
  latitude: number;
  longitude: number;
  elevation: number; // meters
}

export interface DeviceStatus {
  connected: boolean;
  battery: number;
  gpsLat: number;
  gpsLon: number;
  gyroYaw: number;
  gyroPitch: number;
  laserOn: boolean;
}

export interface PointResponse {
  azimuth: number;
  altitude: number;
  servoPan: number;
  servoTilt: number;
}

export interface AppSettings {
  showConstellationLines: boolean;
  showConstellationLabels: boolean;
  showStarLabels: boolean;
  showCoordinateGrid: boolean;
  magnitudeFilter: number;
  nightMode: boolean;
  hudTransparency: number;
}
