import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { raDecToCartesian } from '../../utils/astronomy';

/**
 * Smoothly animates the camera to look at a selected celestial object.
 */
export default function CameraController() {
  const cameraTarget = useAppStore((s) => s.cameraTarget);
  const { camera } = useThree();
  const targetDir = useRef<THREE.Vector3 | null>(null);
  const animating = useRef(false);
  const progress = useRef(0);

  useEffect(() => {
    if (cameraTarget) {
      const [x, y, z] = raDecToCartesian(cameraTarget.ra, cameraTarget.dec, 1);
      targetDir.current = new THREE.Vector3(x, y, z).normalize();
      animating.current = true;
      progress.current = 0;
    }
  }, [cameraTarget]);

  useFrame(() => {
    if (!animating.current || !targetDir.current) return;

    progress.current += 0.02;
    if (progress.current >= 1) {
      progress.current = 1;
      animating.current = false;
    }

    // Smooth easing
    const t = 1 - Math.pow(1 - progress.current, 3);

    // Get current look direction
    const currentDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

    // Slerp between current and target direction
    const currentQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, -1),
      currentDir
    );
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, -1),
      targetDir.current
    );

    const slerpedQuat = currentQuat.slerp(targetQuat, t);
    camera.quaternion.copy(slerpedQuat);
  });

  return null;
}
