import { useCallback, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { raDecToCartesian, equatorialToHorizontal } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';
import { useCatalogStore } from '../../store/useCatalogStore';

/**
 * SkyClickHandler — finds the nearest celestial object to click point
 * by using the SAME transform as the visual rendering (SkyRotation group matrix).
 * This ensures click targets match visual positions exactly.
 */
export default function SkyClickHandler() {
  const { camera, gl, size, scene } = useThree();
  const clickStartRef = useRef<{ x: number; y: number } | null>(null);

  const findNearestObject = useCallback(
    (clientX: number, clientY: number) => {
      const observer = useAppStore.getState().observer;
      const simulationTime = useAppStore.getState().simulationTime;
      const stars = useCatalogStore.getState().stars;
      const dsoObjects = useCatalogStore.getState().dsoObjects;
      const magnitudeFilter = useAppStore.getState().settings.magnitudeFilter;
      const setSelectedObject = useAppStore.getState().setSelectedObject;

      const rect = gl.domElement.getBoundingClientRect();
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

      const clickScreenX = ((ndcX + 1) / 2) * size.width;
      const clickScreenY = ((1 - ndcY) / 2) * size.height;

      // Get the SkyRotation group's ACTUAL world matrix (same transform as visual rendering)
      const skyGroup = scene.getObjectByName('sky-rotation');
      const worldMatrix = skyGroup ? skyGroup.matrixWorld : new THREE.Matrix4();

      const tempVec = new THREE.Vector3();

      // Project using the sky group's world matrix — matches visual positions exactly
      const projectToScreen = (ra: number, dec: number, radius: number): { x: number; y: number } | null => {
        const [px, py, pz] = raDecToCartesian(ra, dec, radius);
        tempVec.set(px, py, pz);

        // Apply the sky rotation group's world transform (same as rendering)
        tempVec.applyMatrix4(worldMatrix);

        // Project to screen
        tempVec.project(camera);
        if (tempVec.z > 1) return null;

        return {
          x: ((tempVec.x + 1) / 2) * size.width,
          y: ((1 - tempVec.y) / 2) * size.height,
        };
      };

      const MAX_CLICK_DIST = 30;
      let bestDist = MAX_CLICK_DIST;
      let bestResult: {
        id: string;
        name: string;
        type: 'star' | 'dso';
        ra: number;
        dec: number;
        magnitude?: number;
        constellation?: string;
        spectral?: string;
      } | null = null;

      // Search stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (star.mag > magnitudeFilter) continue;

        const screen = projectToScreen(star.ra, star.dec, 500);
        if (!screen) continue;

        const dx = screen.x - clickScreenX;
        const dy = screen.y - clickScreenY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const clickRadius = Math.min(MAX_CLICK_DIST, MAX_CLICK_DIST - star.mag * 2);
        if (dist < clickRadius && dist < bestDist) {
          bestDist = dist;
          bestResult = {
            id: `star-${star.hip}`,
            name: star.name || `HIP ${star.hip}`,
            type: 'star',
            ra: star.ra,
            dec: star.dec,
            magnitude: star.mag,
            constellation: star.constellation || undefined,
            spectral: star.spectral,
          };
        }
      }

      // Search DSOs
      for (let i = 0; i < dsoObjects.length; i++) {
        const dso = dsoObjects[i];

        const screen = projectToScreen(dso.ra, dso.dec, 498);
        if (!screen) continue;

        const dx = screen.x - clickScreenX;
        const dy = screen.y - clickScreenY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MAX_CLICK_DIST && dist < bestDist) {
          bestDist = dist;
          bestResult = {
            id: `dso-${dso.id}`,
            name: dso.commonName
              ? `${dso.displayName} (${dso.commonName.split(',')[0]})`
              : dso.displayName,
            type: 'dso',
            ra: dso.ra,
            dec: dso.dec,
            magnitude: dso.mag ?? undefined,
            constellation: dso.constellation || undefined,
          };
        }
      }

      // Select the nearest object
      if (bestResult) {
        const hz = equatorialToHorizontal(bestResult.ra, bestResult.dec, observer, simulationTime);
        setSelectedObject({
          id: bestResult.id,
          name: bestResult.name,
          type: bestResult.type,
          ra: bestResult.ra,
          dec: bestResult.dec,
          azimuth: hz.azimuth,
          altitude: hz.altitude,
          magnitude: bestResult.magnitude,
          constellation: bestResult.constellation,
          spectral: bestResult.spectral,
        });
      }
    },
    [camera, gl, size, scene]
  );

  // Event listeners — distinguish clicks from drags
  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      clickStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const start = clickStartRef.current;
      if (!start) return;
      clickStartRef.current = null;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.sqrt(dx * dx + dy * dy) < 5) {
        findNearestObject(e.clientX, e.clientY);
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
    };
  }, [gl, findNearestObject]);

  return null;
}
