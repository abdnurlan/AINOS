import { useMemo, useCallback } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { raDecToCartesian, equatorialToHorizontal } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';
import { useCatalogStore } from '../../store/useCatalogStore';
import type { Star } from '../../types';

export default function ClickableStars() {
  const setSelectedObject = useAppStore((s) => s.setSelectedObject);
  const observer = useAppStore((s) => s.observer);
  const simulationTime = useAppStore((s) => s.simulationTime);
  const stars = useCatalogStore((s) => s.stars);

  const clickableStars = useMemo(() => {
    return stars.filter((s) => s.name && s.mag < 4.5);
  }, [stars]);

  const handleClick = useCallback(
    (star: Star, e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      const hz = equatorialToHorizontal(star.ra, star.dec, observer, simulationTime);

      const name = star.name || `HIP ${star.hip}`;

      setSelectedObject({
        id: `star-${star.hip}`,
        name,
        type: 'star',
        ra: star.ra,
        dec: star.dec,
        azimuth: hz.azimuth,
        altitude: hz.altitude,
        magnitude: star.mag,
        constellation: star.constellation || undefined,
        spectral: star.spectral,
      });
    },
    [setSelectedObject, observer, simulationTime]
  );

  const starMeshes = useMemo(() => {
    return clickableStars.map((star) => {
      const [x, y, z] = raDecToCartesian(star.ra, star.dec, 490);
      const hitSize = Math.max(6, 14 - star.mag * 2);
      return { star, x, y, z, hitSize };
    });
  }, [clickableStars]);

  return (
    <group>
      {starMeshes.map(({ star, x, y, z, hitSize }) => (
        <mesh
          key={star.hip}
          position={[x, y, z]}
          onClick={(e) => handleClick(star, e)}
        >
          <sphereGeometry args={[hitSize, 4, 4]} />
          <meshBasicMaterial
            transparent
            opacity={0}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      ))}
    </group>
  );
}
