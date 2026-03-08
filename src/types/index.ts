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

export type CelestialObjectType = 'star' | 'planet' | 'moon' | 'sun' | 'constellation' | 'dso';

export type DSOType = 
  | 'galaxy'
  | 'galaxy_pair'
  | 'galaxy_triplet'
  | 'galaxy_group'
  | 'globular_cluster'
  | 'open_cluster'
  | 'cluster_nebula'
  | 'planetary_nebula'
  | 'emission_nebula'
  | 'reflection_nebula'
  | 'dark_nebula'
  | 'nebula'
  | 'hii_region'
  | 'supernova_remnant'
  | 'nova'
  | 'stellar_association'
  | 'star'
  | 'double_star'
  | 'other'
  | 'unknown';

export interface DSO {
  id: string;
  name: string;           // NGC/IC designation
  messier: number | null; // Messier number if applicable
  displayName: string;    // M31 or NGC224
  type: DSOType;
  ra: number;             // Right Ascension in degrees
  dec: number;            // Declination in degrees
  mag: number | null;     // Visual magnitude
  majorAxis: number | null; // Size in arcminutes
  minorAxis: number | null;
  constellation: string | null;
  commonName: string | null; // e.g., "Andromeda Galaxy"
  surfaceBrightness: number | null;
  hubbleType: string | null; // Galaxy morphology
}

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

export interface LaserTarget {
  ra: number;
  dec: number;
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
  showDSO: boolean;
  showDSOLabels: boolean;
  showNebulae: boolean;
  showGalaxies: boolean;
  showClusters: boolean;
  magnitudeFilter: number;
  dsoMagnitudeFilter: number;
  nightMode: boolean;
  hudTransparency: number;
}
