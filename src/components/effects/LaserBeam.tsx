import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getLocalSiderealTime, raDecToCartesian } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';

export default function LaserBeam() {
  const laserTarget = useAppStore((s) => s.laserTarget);
  const laserOn = useAppStore((s) => s.deviceStatus.laserOn);
  const observer = useAppStore((s) => s.observer);
  const simulationTime = useAppStore((s) => s.simulationTime);
  const { camera } = useThree();
  const coreBeamRef = useRef<THREE.Mesh>(null);
  const glowBeamRef = useRef<THREE.Mesh>(null);
  const coreTargetRef = useRef<THREE.Mesh>(null);
  const glowTargetRef = useRef<THREE.Mesh>(null);

  const targetPosition = useMemo(() => {
    if (!laserTarget || !laserOn) return null;
    const localTarget = new THREE.Vector3(...raDecToCartesian(laserTarget.ra, laserTarget.dec, 492));
    const lst = getLocalSiderealTime(observer, simulationTime);
    const rotAngle = (lst / 24) * Math.PI * 2;
    const latRad = (observer.latitude * Math.PI) / 180;

    const skyTransform = new THREE.Object3D();
    skyTransform.rotateY(-rotAngle);
    skyTransform.rotateX(-(Math.PI / 2 - latRad));

    return localTarget.applyQuaternion(skyTransform.quaternion);
  }, [laserOn, laserTarget, observer, simulationTime]);

  useFrame(({ clock }) => {
    if (!targetPosition || !laserOn) return;

    const t = clock.getElapsedTime();
    const cameraPosition = camera.getWorldPosition(new THREE.Vector3());
    const forward = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()))
      .normalize();
    const start = cameraPosition.addScaledVector(forward, 0.8);
    const end = targetPosition.clone();
    const direction = end.clone().sub(start);
    const length = direction.length();

    if (length <= 0.001) return;

    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const beamQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );

    if (coreBeamRef.current) {
      coreBeamRef.current.position.copy(midpoint);
      coreBeamRef.current.quaternion.copy(beamQuaternion);
      coreBeamRef.current.scale.set(1, length, 1);
    }

    if (glowBeamRef.current) {
      const material = glowBeamRef.current.material as THREE.MeshBasicMaterial;
      glowBeamRef.current.position.copy(midpoint);
      glowBeamRef.current.quaternion.copy(beamQuaternion);
      glowBeamRef.current.scale.set(1, length, 1);
      material.opacity = 0.18 + Math.sin(t * 5) * 0.05;
    }

    if (coreTargetRef.current) {
      const scale = 1 + Math.sin(t * 10) * 0.12;
      coreTargetRef.current.position.copy(end);
      coreTargetRef.current.scale.setScalar(scale);
    }

    if (glowTargetRef.current) {
      const material = glowTargetRef.current.material as THREE.MeshBasicMaterial;
      const scale = 1.4 + Math.sin(t * 4.5) * 0.18;
      glowTargetRef.current.position.copy(end);
      glowTargetRef.current.scale.setScalar(scale);
      material.opacity = 0.18 + Math.sin(t * 5) * 0.05;
    }

  });

  if (!targetPosition) return null;

  return (
    <group>
      {/* Outer glow beam */}
      <mesh ref={glowBeamRef}>
        <cylinderGeometry args={[0.12, 0.12, 1, 12, 1, true]} />
        <meshBasicMaterial
          color="#ff3333"
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Core laser beam */}
      <mesh ref={coreBeamRef}>
        <cylinderGeometry args={[0.03, 0.03, 1, 8, 1, true]} />
        <meshBasicMaterial
          color="#ff0000"
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Target glow */}
      <mesh ref={glowTargetRef} position={targetPosition}>
        <sphereGeometry args={[4, 16, 16]} />
        <meshBasicMaterial
          color="#ff3333"
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Target core */}
      <mesh ref={coreTargetRef} position={targetPosition}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial
          color="#ff0000"
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
