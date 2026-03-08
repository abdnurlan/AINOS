import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';

/**
 * Renders a wireframe coordinate grid (equatorial grid)
 * showing RA hour lines and Dec parallels.
 */
export default function CoordinateGrid() {
  const show = useAppStore((s) => s.settings.showCoordinateGrid);

  const lines = useMemo(() => {
    if (!show) return [];
    const radius = 496;
    const result: THREE.Vector3[][] = [];

    // RA lines (24 hour lines, every 15°)
    for (let raH = 0; raH < 24; raH++) {
      const raDeg = raH * 15;
      const raRad = (raDeg * Math.PI) / 180;
      const points: THREE.Vector3[] = [];

      for (let decDeg = -90; decDeg <= 90; decDeg += 2) {
        const decRad = (decDeg * Math.PI) / 180;
        const x = radius * Math.cos(decRad) * Math.cos(raRad);
        const y = radius * Math.sin(decRad);
        const z = -radius * Math.cos(decRad) * Math.sin(raRad);
        points.push(new THREE.Vector3(x, y, z));
      }
      result.push(points);
    }

    // Dec parallels (every 15°)
    for (let decDeg = -75; decDeg <= 75; decDeg += 15) {
      const decRad = (decDeg * Math.PI) / 180;
      const points: THREE.Vector3[] = [];

      for (let raDeg = 0; raDeg <= 360; raDeg += 2) {
        const raRad = (raDeg * Math.PI) / 180;
        const x = radius * Math.cos(decRad) * Math.cos(raRad);
        const y = radius * Math.sin(decRad);
        const z = -radius * Math.cos(decRad) * Math.sin(raRad);
        points.push(new THREE.Vector3(x, y, z));
      }
      result.push([...points, points[0].clone()]);
    }

    return result;
  }, [show]);

  if (!show) return null;

  return (
    <group>
      {lines.map((points, i) => {
        return (
          <Line
            key={i}
            points={points}
            color="#1e3a5f"
            lineWidth={0.6}
            transparent
            opacity={0.15}
          />
        );
      })}
    </group>
  );
}
