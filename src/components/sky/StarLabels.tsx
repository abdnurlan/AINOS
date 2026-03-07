import { useMemo } from 'react';
import { Billboard, Text } from '@react-three/drei';
import starsData from '../../data/stars.json';
import { raDecToCartesian } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';
import type { Star } from '../../types';

const stars = starsData as Star[];

/**
 * Renders floating text labels for bright named stars in the 3D scene.
 * Only displays labels for stars brighter than magnitude 3.0 that have names.
 */
export default function StarLabels() {
  const showLabels = useAppStore((s) => s.settings.showStarLabels);

  const labelData = useMemo(() => {
    return stars
      .filter((s) => s.name && s.mag < 3.0)
      .map((s) => {
        const [x, y, z] = raDecToCartesian(s.ra, s.dec, 490);
        return {
          name: s.name!,
          position: [x, y + 5, z] as [number, number, number],
          mag: s.mag,
        };
      });
  }, []);

  if (!showLabels) return null;

  return (
    <group>
      {labelData.map((star, i) => (
        <Billboard key={i} position={star.position}>
          <Text
            fontSize={star.mag < 1 ? 3.2 : 2.5}
            color={star.mag < 1 ? '#e8edf5' : '#8090b0'}
            anchorX="center"
            anchorY="bottom"
            fillOpacity={star.mag < 1 ? 0.9 : 0.6}
            outlineWidth={0.12}
            outlineColor="#000000"
          >
            {star.name}
          </Text>
        </Billboard>
      ))}
    </group>
  );
}
