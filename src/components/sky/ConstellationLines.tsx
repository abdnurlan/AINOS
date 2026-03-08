import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { raDecToCartesian } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';
import { useCatalogStore } from '../../store/useCatalogStore';

export default function ConstellationLines() {
  const show = useAppStore((s) => s.settings.showConstellationLines);
  const stars = useCatalogStore((s) => s.stars);
  const constellations = useCatalogStore((s) => s.constellations);

  const lineSegments = useMemo(() => {
    if (!show) return [];

    const starMap = new Map<number, (typeof stars)[number]>();
    stars.forEach((star) => starMap.set(star.hip, star));

    const segments: { points: [number, number, number][] }[] = [];

    constellations.forEach((c) => {
      c.lines.forEach(({ from, to }) => {
        if (from === to) return;
        const fromStar = starMap.get(from);
        const toStar = starMap.get(to);
        if (!fromStar || !toStar) return;

        const fromPoint = raDecToCartesian(fromStar.ra, fromStar.dec, 499);
        const toPoint = raDecToCartesian(toStar.ra, toStar.dec, 499);
        segments.push({ points: [fromPoint, toPoint] });
      });
    });

    return segments;
  }, [constellations, show, stars]);

  if (!show) return null;

  return (
    <group>
      {lineSegments.map((seg, i) => (
        <Line
          key={i}
          points={seg.points}
          color="#4d9aff"
          lineWidth={1.2}
          transparent
          opacity={0.5}
        />
      ))}
    </group>
  );
}
