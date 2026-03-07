import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import starsData from '../../data/stars.json';
import constellationsData from '../../data/constellations.json';
import { raDecToCartesian } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';
import type { Star } from '../../types';

const stars = starsData as Star[];

interface ConstellationEntry {
  name: string;
  abbr: string;
  lines: number[][];
}

const constellations = constellationsData as ConstellationEntry[];

// Build a lookup map: HIP ID → star
const starMap = new Map<number, Star>();
stars.forEach((s) => starMap.set(s.hip, s));

export default function ConstellationLines() {
  const show = useAppStore((s) => s.settings.showConstellationLines);

  const lineSegments = useMemo(() => {
    if (!show) return [];

    const segments: { points: [number, number, number][] }[] = [];

    constellations.forEach((c) => {
      c.lines.forEach(([fromHip, toHip]) => {
        if (fromHip === toHip) return; // Skip self-references
        const fromStar = starMap.get(fromHip);
        const toStar = starMap.get(toHip);
        if (!fromStar || !toStar) return;

        const from = raDecToCartesian(fromStar.ra, fromStar.dec, 499);
        const to = raDecToCartesian(toStar.ra, toStar.dec, 499);
        segments.push({ points: [from, to] });
      });
    });

    return segments;
  }, [show]);

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
