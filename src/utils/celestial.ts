import type { CelestialObject, CelestialObjectType } from '../types';

const OBJECT_TYPES = new Set<CelestialObjectType>([
  'star',
  'planet',
  'moon',
  'sun',
  'constellation',
  'dso',
]);

function toFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeRa(ra: number): number {
  return ((ra % 360) + 360) % 360;
}

function clampDec(dec: number): number {
  return Math.max(-90, Math.min(90, dec));
}

function sanitizeOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function hasFiniteCelestialCoordinates(
  object: Pick<CelestialObject, 'ra' | 'dec'> | null | undefined
): boolean {
  if (!object) return false;
  return Number.isFinite(object.ra) && Number.isFinite(object.dec);
}

export function sanitizeCelestialObject(object: CelestialObject | null): CelestialObject | null {
  if (!object) return null;
  if (!OBJECT_TYPES.has(object.type)) return null;

  const ra = toFiniteNumber(object.ra);
  const dec = toFiniteNumber(object.dec);
  if (ra === undefined || dec === undefined) return null;

  const azimuth = toFiniteNumber(object.azimuth);
  const altitude = toFiniteNumber(object.altitude);
  const magnitude = toFiniteNumber(object.magnitude);

  return {
    id: sanitizeOptionalString(object.id) ?? `${object.type}-${sanitizeOptionalString(object.name) ?? 'unknown'}`,
    name: sanitizeOptionalString(object.name) ?? 'Unknown Object',
    type: object.type,
    ra: normalizeRa(ra),
    dec: clampDec(dec),
    azimuth,
    altitude,
    magnitude,
    distance: sanitizeOptionalString(object.distance),
    constellation: sanitizeOptionalString(object.constellation),
    spectral: sanitizeOptionalString(object.spectral),
  };
}
