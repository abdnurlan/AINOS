// ==============================
// AINOS Astronomy Utilities
// ==============================
// Wraps the 'astronomy-engine' library for coordinate conversions,
// planet position calculations, and star rendering helpers.

import * as Astronomy from 'astronomy-engine';
import type { ObserverLocation, Planet } from '../types';

/**
 * Convert Right Ascension (degrees) and Declination (degrees)
 * to a 3D vector on the celestial sphere.
 */
export function raDecToCartesian(
  raDeg: number,
  decDeg: number,
  radius: number = 100
): [number, number, number] {
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  const x = radius * Math.cos(dec) * Math.cos(ra);
  const y = radius * Math.sin(dec);
  const z = -radius * Math.cos(dec) * Math.sin(ra);
  return [x, y, z];
}

/**
 * Convert cartesian coordinates back to RA/Dec
 */
export function cartesianToRaDec(
  x: number,
  y: number,
  z: number
): { ra: number; dec: number } {
  const r = Math.sqrt(x * x + y * y + z * z);
  const dec = Math.asin(y / r) * (180 / Math.PI);
  let ra = Math.atan2(-z, x) * (180 / Math.PI);
  if (ra < 0) ra += 360;
  return { ra, dec };
}

/**
 * Convert equatorial coordinates (RA/Dec) to horizontal coordinates (Az/Alt)
 * given observer location and time.
 */
export function equatorialToHorizontal(
  raDeg: number,
  decDeg: number,
  observer: ObserverLocation,
  date: Date = new Date()
): { azimuth: number; altitude: number } {
  const obs = new Astronomy.Observer(observer.latitude, observer.longitude, observer.elevation);
  const time = Astronomy.MakeTime(date);

  // Convert RA from degrees to hours
  const raHours = raDeg / 15;

  // Use Astronomy.Horizon for proper conversion
  const horizon = Astronomy.Horizon(time, obs, raHours, decDeg, 'normal');

  return {
    azimuth: horizon.azimuth,
    altitude: horizon.altitude,
  };
}

/**
 * Get the Local Sidereal Time for a given observer location and date.
 */
export function getLocalSiderealTime(observer: ObserverLocation, date: Date = new Date()): number {
  const time = Astronomy.MakeTime(date);
  const gst = Astronomy.SiderealTime(time); // Greenwich Sidereal Time in hours
  const lst = (gst + observer.longitude / 15) % 24;
  return lst < 0 ? lst + 24 : lst;
}

/**
 * Calculate planet positions for a given observer and time.
 */
export function calculatePlanetPositions(
  observer: ObserverLocation,
  date: Date = new Date()
): Planet[] {
  const obs = new Astronomy.Observer(observer.latitude, observer.longitude, observer.elevation);
  const time = Astronomy.MakeTime(date);

  const bodies: Astronomy.Body[] = [
    Astronomy.Body.Mercury,
    Astronomy.Body.Venus,
    Astronomy.Body.Mars,
    Astronomy.Body.Jupiter,
    Astronomy.Body.Saturn,
    Astronomy.Body.Uranus,
    Astronomy.Body.Neptune,
    Astronomy.Body.Moon,
    Astronomy.Body.Sun,
  ];

  return bodies.map((body) => {
    const equator = Astronomy.Equator(body, time, obs, true, true);
    const horizon = Astronomy.Horizon(time, obs, equator.ra, equator.dec, 'normal');

    // Get distance and visual magnitude
    let magnitude = 0;
    let distance = equator.dist;

    try {
      if (body !== Astronomy.Body.Moon && body !== Astronomy.Body.Sun) {
        const illum = Astronomy.Illumination(body, time);
        magnitude = illum.mag;
        distance = illum.geo_dist;
      } else if (body === Astronomy.Body.Moon) {
        magnitude = -12.7; // approximate
      } else if (body === Astronomy.Body.Sun) {
        magnitude = -26.74;
      }
    } catch {
      // fallback magnitude
    }

    return {
      name: body.toString(),
      ra: equator.ra * 15, // Convert hours to degrees
      dec: equator.dec,
      azimuth: horizon.azimuth,
      altitude: horizon.altitude,
      magnitude,
      distance,
    };
  });
}

/**
 * Map star magnitude to visual size for rendering.
 * Brighter stars (lower magnitude) get larger sizes.
 */
export function magnitudeToSize(mag: number): number {
  // Much larger sizes for visibility
  // Sirius (mag -1.46) → ~12, Polaris (mag 2) → ~5, faintest (mag 6.5) → ~1.0
  const minSize = 1.0;
  const maxSize = 14.0;
  const normalized = (6.5 - mag) / 8.0; // 0 to 1 range for mag 6.5 to -1.5
  const size = minSize + (maxSize - minSize) * Math.pow(Math.max(0, normalized), 1.5);
  return Math.max(minSize, Math.min(maxSize, size));
}

/**
 * Map spectral type to star color.
 */
export function spectralToColor(spectral: string): [number, number, number] {
  if (!spectral) return [1, 1, 1];
  const type = spectral.charAt(0).toUpperCase();
  switch (type) {
    case 'O': return [0.62, 0.70, 1.0];   // Blue
    case 'B': return [0.70, 0.78, 1.0];   // Blue-white
    case 'A': return [0.85, 0.88, 1.0];   // White
    case 'F': return [1.0, 0.98, 0.90];   // Yellow-white
    case 'G': return [1.0, 0.93, 0.74];   // Yellow
    case 'K': return [1.0, 0.80, 0.54];   // Orange
    case 'M': return [1.0, 0.60, 0.42];   // Red
    default:  return [1.0, 1.0, 1.0];     // White
  }
}

/**
 * Format Right Ascension in hours/minutes/seconds.
 */
export function formatRA(raDeg: number): string {
  const raHours = raDeg / 15;
  const h = Math.floor(raHours);
  const m = Math.floor((raHours - h) * 60);
  const s = ((raHours - h - m / 60) * 3600).toFixed(1);
  return `${h}h ${m}m ${s}s`;
}

/**
 * Format Declination in degrees/arcminutes/arcseconds.
 */
export function formatDec(decDeg: number): string {
  const sign = decDeg >= 0 ? '+' : '-';
  const abs = Math.abs(decDeg);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = ((abs - d - m / 60) * 3600).toFixed(1);
  return `${sign}${d}° ${m}' ${s}"`;
}

/**
 * Format azimuth/altitude.
 */
export function formatAzAlt(az: number, alt: number): string {
  return `Az: ${az.toFixed(1)}° Alt: ${alt.toFixed(1)}°`;
}
