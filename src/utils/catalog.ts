import type { CelestialObject, CelestialObjectType, Constellation, ObserverLocation, Star } from '../types';
import {
  calculatePlanetPositions,
  cartesianToRaDec,
  equatorialToHorizontal,
  raDecToCartesian,
} from './astronomy';

export interface ConstellationCatalogEntry {
  id: string;
  name: string;
  abbr: string;
  ra: number;
  dec: number;
}

export function buildConstellationCatalog(
  stars: Star[],
  constellations: Constellation[]
): ConstellationCatalogEntry[] {
  const starMap = new Map<number, Star>();
  stars.forEach((star) => {
    starMap.set(star.hip, star);
  });

  return constellations
    .map((constellation) => {
      const starIds = new Set<number>(constellation.lines.flatMap((line) => [line.from, line.to]));
      let sumX = 0;
      let sumY = 0;
      let sumZ = 0;
      let count = 0;

      starIds.forEach((hip) => {
        const star = starMap.get(hip);
        if (!star) return;

        const [x, y, z] = raDecToCartesian(star.ra, star.dec, 1);
        sumX += x;
        sumY += y;
        sumZ += z;
        count += 1;
      });

      if (count === 0) return null;

      const { ra, dec } = cartesianToRaDec(sumX / count, sumY / count, sumZ / count);

      return {
        id: `constellation-${constellation.abbr.toLowerCase()}`,
        name: constellation.name,
        abbr: constellation.abbr,
        ra,
        dec,
      };
    })
    .filter((entry): entry is ConstellationCatalogEntry => entry !== null);
}

export function getConstellationObjects(
  constellationCatalog: ConstellationCatalogEntry[],
  observer: ObserverLocation,
  date: Date
): CelestialObject[] {
  return constellationCatalog.map((constellation) => {
    const hz = equatorialToHorizontal(constellation.ra, constellation.dec, observer, date);

    return {
      id: constellation.id,
      name: constellation.name,
      type: 'constellation',
      ra: constellation.ra,
      dec: constellation.dec,
      azimuth: hz.azimuth,
      altitude: hz.altitude,
      constellation: constellation.abbr,
    };
  });
}

function getPlanetType(name: string): CelestialObjectType {
  if (name === 'Moon') return 'moon';
  if (name === 'Sun') return 'sun';
  return 'planet';
}

export function resolveCelestialObject(
  object: CelestialObject,
  observer: ObserverLocation,
  date: Date
): CelestialObject {
  try {
    if (object.type === 'planet' || object.type === 'moon' || object.type === 'sun') {
      const planet = calculatePlanetPositions(observer, date).find(
        (entry) => entry.name.toLowerCase() === object.name.toLowerCase()
      );

      if (!planet) return object;

      return {
        ...object,
        type: getPlanetType(planet.name),
        ra: planet.ra,
        dec: planet.dec,
        azimuth: planet.azimuth,
        altitude: planet.altitude,
        magnitude: planet.magnitude,
        distance: `${planet.distance.toFixed(3)} AU`,
      };
    }

    const hz = equatorialToHorizontal(object.ra, object.dec, observer, date);

    return {
      ...object,
      azimuth: hz.azimuth,
      altitude: hz.altitude,
    };
  } catch (error) {
    console.error('resolveCelestialObject error:', error);
    return object;
  }
}
