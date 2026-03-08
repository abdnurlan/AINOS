/**
 * Laser API client for communicating with backend.
 * 
 * API Endpoints:
 * - POST /api/laser/point - Point laser at coordinates
 * - POST /api/laser/off - Turn off laser
 * - GET /api/laser/status - Get current status
 */

const API_BASE = 'http://localhost:8080/api/laser';

export interface LaserCommand {
  ra: number;        // Right Ascension in degrees (0-360)
  dec: number;       // Declination in degrees (-90 to +90)
  objectName?: string;  // Optional: name of target object
  objectType?: string;  // Optional: type (star, planet, dso, etc.)
}

export interface LaserStatus {
  active: boolean;
  targetRa: number | null;
  targetDec: number | null;
  altitude?: number | null;
  azimuth?: number | null;
  servoAzimuth?: number | null;
  servoAltitude?: number | null;
  aboveHorizon?: boolean;
  objectName?: string | null;
  objectType?: string | null;
  timestamp: string;
}

function normalizeLaserStatus(raw: unknown): LaserStatus {
  const status = (raw ?? {}) as Record<string, unknown>;
  return {
    active: Boolean(status.active),
    targetRa: typeof status.targetRa === 'number' ? status.targetRa : null,
    targetDec: typeof status.targetDec === 'number' ? status.targetDec : null,
    altitude: typeof status.altitude === 'number' ? status.altitude : null,
    azimuth: typeof status.azimuth === 'number' ? status.azimuth : null,
    servoAzimuth: typeof status.servoAzimuth === 'number' ? status.servoAzimuth : null,
    servoAltitude: typeof status.servoAltitude === 'number' ? status.servoAltitude : null,
    aboveHorizon: typeof status.aboveHorizon === 'boolean' ? status.aboveHorizon : undefined,
    objectName: typeof status.objectName === 'string' ? status.objectName : null,
    objectType: typeof status.objectType === 'string' ? status.objectType : null,
    timestamp:
      typeof status.timestamp === 'string' ? status.timestamp : new Date().toISOString(),
  };
}

/**
 * Point laser at celestial coordinates.
 * 
 * @param command - Laser command with RA/Dec coordinates
 * @returns LaserStatus with calculated alt/az
 */
export async function pointLaser(command: LaserCommand): Promise<LaserStatus> {
  console.log('📡 Sending laser command to backend:', command);
  
  const response = await fetch(`${API_BASE}/point`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`Laser API error: ${response.status}`);
  }

  const status = normalizeLaserStatus(await response.json());
  console.log('✅ Laser status:', status);
  return status;
}

/**
 * Turn off laser.
 */
export async function turnOffLaser(): Promise<LaserStatus> {
  console.log('📡 Turning off laser');
  
  const response = await fetch(`${API_BASE}/off`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Laser API error: ${response.status}`);
  }

  return normalizeLaserStatus(await response.json());
}

/**
 * Get current laser status.
 */
export async function getLaserStatus(): Promise<LaserStatus> {
  const response = await fetch(`${API_BASE}/status`);

  if (!response.ok) {
    throw new Error(`Laser API error: ${response.status}`);
  }

  return normalizeLaserStatus(await response.json());
}
