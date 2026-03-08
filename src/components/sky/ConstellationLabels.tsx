import { useMemo } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import { useCatalogStore } from '../../store/useCatalogStore';
import { buildConstellationCatalog } from '../../utils/catalog';
import { raDecToCartesian } from '../../utils/astronomy';

export default function ConstellationLabels() {
  const showLabels = useAppStore((s) => s.settings.showConstellationLabels);
  const stars = useCatalogStore((s) => s.stars);
  const constellations = useCatalogStore((s) => s.constellations);

  const labels = useMemo(
    () =>
      buildConstellationCatalog(stars, constellations).map((constellation) => {
        const [x, y, z] = raDecToCartesian(constellation.ra, constellation.dec, 470);

        return {
          id: constellation.id,
          name: constellation.name,
          position: [x, y, z] as [number, number, number],
        };
      }),
    [constellations, stars]
  );

  if (!showLabels) return null;

  return (
    <group>
      {labels.map((label) => (
        <Billboard key={label.id} position={label.position}>
          <Text
            fontSize={5}
            color="#5d87c9"
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.38}
            outlineWidth={0.08}
            outlineColor="#01040a"
          >
            {label.name}
          </Text>
        </Billboard>
      ))}
    </group>
  );
}
