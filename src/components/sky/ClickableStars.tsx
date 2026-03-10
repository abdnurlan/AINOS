import { useMemo, useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { raDecToCartesian, equatorialToHorizontal } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';
import { useCatalogStore } from '../../store/useCatalogStore';

/**
 * Invisible hit-targets for ALL visible stars using InstancedMesh.
 * InstancedMesh = one draw call for thousands of objects → great performance.
 */
export default function ClickableStars() {
  const setSelectedObject = useAppStore((s) => s.setSelectedObject);
  const observer = useAppStore((s) => s.observer);
  const simulationTime = useAppStore((s) => s.simulationTime);
  const magnitudeFilter = useAppStore((s) => s.settings.magnitudeFilter);
  const stars = useCatalogStore((s) => s.stars);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // All visible above-horizon stars
  const clickableStars = useMemo(() => {
    return stars.filter((s) => {
      if (s.mag > magnitudeFilter) return false;
      const hz = equatorialToHorizontal(s.ra, s.dec, observer, simulationTime);
      return hz.altitude > -2;
    });
  }, [stars, observer, simulationTime, magnitudeFilter]);

  // Pre-compute positions
  const starData = useMemo(() => {
    return clickableStars.map((star) => {
      const [x, y, z] = raDecToCartesian(star.ra, star.dec, 490);
      // Brighter stars get bigger hit targets
      const hitSize = Math.max(4, 12 - star.mag * 1.5);
      return { star, x, y, z, hitSize };
    });
  }, [clickableStars]);

  // Update instance matrices
  useEffect(() => {
    if (!meshRef.current || starData.length === 0) return;
    const mesh = meshRef.current;
    const matrix = new THREE.Matrix4();
    const scale = new THREE.Vector3();

    starData.forEach(({ x, y, z, hitSize }, i) => {
      matrix.makeTranslation(x, y, z);
      scale.set(hitSize, hitSize, hitSize);
      matrix.scale(scale);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [starData]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.instanceId === undefined || e.instanceId >= clickableStars.length) return;

      const star = clickableStars[e.instanceId];
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
    [setSelectedObject, observer, simulationTime, clickableStars]
  );

  if (starData.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, starData.length]}
      onClick={handleClick}
    >
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
      />
    </instancedMesh>
  );
}
