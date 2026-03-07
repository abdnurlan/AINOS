import { useMemo, useCallback } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import starsData from '../../data/stars.json';
import { raDecToCartesian, equatorialToHorizontal } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';
import type { Star, CelestialObject } from '../../types';

const stars = starsData as Star[];

export default function ClickableStars() {
  const setSelectedObject = useAppStore((s) => s.setSelectedObject);
  const setCameraTarget = useAppStore((s) => s.setCameraTarget);
  const observer = useAppStore((s) => s.observer);

  // Only make named/bright stars clickable for performance
  const clickableStars = useMemo(() => {
    return stars.filter((s) => s.name || s.mag <= 3.5);
  }, []);

  const handleClick = useCallback(
    (star: Star, e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      const hz = equatorialToHorizontal(star.ra, star.dec, observer);

      const obj: CelestialObject = {
        id: `star-${star.hip}`,
        name: star.name || `HIP ${star.hip}`,
        type: 'star',
        ra: star.ra,
        dec: star.dec,
        azimuth: hz.azimuth,
        altitude: hz.altitude,
        magnitude: star.mag,
        constellation: star.constellation || undefined,
        spectral: star.spectral,
      };

      setSelectedObject(obj);
      setCameraTarget({ ra: star.ra, dec: star.dec });
    },
    [setSelectedObject, setCameraTarget, observer]
  );

  return (
    <group>
      {clickableStars.map((star, i) => {
        const [x, y, z] = raDecToCartesian(star.ra, star.dec, 498);
        const hitSize = Math.max(4, 8 - star.mag * 0.8);

        return (
          <mesh
            key={`${star.hip}-${i}`}
            position={[x, y, z]}
            onClick={(e) => handleClick(star, e)}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default';
            }}
          >
            <sphereGeometry args={[hitSize, 8, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}
