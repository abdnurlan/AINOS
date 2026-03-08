import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { raDecToCartesian } from '../../utils/astronomy';
import { resolveCelestialObject } from '../../utils/catalog';
import { useAppStore } from '../../store/useAppStore';

export default function CelestialMarker() {
  const selectedObject = useAppStore((s) => s.selectedObject);
  const observer = useAppStore((s) => s.observer);
  const simulationTime = useAppStore((s) => s.simulationTime);
  const innerRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);

  const resolvedObject = useMemo(() => {
    if (!selectedObject) return null;
    return resolveCelestialObject(selectedObject, observer, simulationTime);
  }, [observer, selectedObject, simulationTime]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (innerRef.current) {
      const scale = 1 + Math.sin(t * 3) * 0.15;
      innerRef.current.scale.set(scale, scale, scale);
      innerRef.current.lookAt(0, 0, 0);
    }

    if (outerRef.current) {
      const scale = 1.5 + Math.sin(t * 2) * 0.3;
      outerRef.current.scale.set(scale, scale, scale);
      (outerRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.15 + Math.sin(t * 2.5) * 0.08;
      outerRef.current.lookAt(0, 0, 0);
    }
  });

  if (!resolvedObject) return null;

  const [x, y, z] = raDecToCartesian(resolvedObject.ra, resolvedObject.dec, 493);

  return (
    <group position={[x, y, z]}>
      {/* Inner bright marker */}
      <mesh ref={innerRef}>
        <circleGeometry args={[3, 32]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer glow pulse */}
      <mesh ref={outerRef}>
        <circleGeometry args={[8, 32]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
