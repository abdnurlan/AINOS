import { useCallback, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { equatorialToHorizontal } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';
import { useCatalogStore } from '../../store/useCatalogStore';

/**
 * SkyClickHandler — listens for clicks on the Three.js canvas and finds
 * the nearest celestial object (star, DSO) to the click point
 * using screen-space projection. Same approach used by Stellarium.
 */
export default function SkyClickHandler() {
  const { camera, gl, size } = useThree();
  const observerRef = useRef(useAppStore.getState().observer);
  const simTimeRef = useRef(useAppStore.getState().simulationTime);
  const clickStartRef = useRef<{ x: number; y: number } | null>(null);

  // Keep refs in sync without causing re-renders
  useEffect(() => {
    const unsub = useAppStore.subscribe((state) => {
      observerRef.current = state.observer;
      simTimeRef.current = state.simulationTime;
    });
    return unsub;
  }, []);

  const findNearestObject = useCallback(
    (clientX: number, clientY: number) => {
      const observer = observerRef.current;
      const simulationTime = simTimeRef.current;
      const stars = useCatalogStore.getState().stars;
      const dsoObjects = useCatalogStore.getState().dsoObjects;
      const magnitudeFilter = useAppStore.getState().settings.magnitudeFilter;
      const setSelectedObject = useAppStore.getState().setSelectedObject;

      const rect = gl.domElement.getBoundingClientRect();
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

      const clickScreenX = ((ndcX + 1) / 2) * size.width;
      const clickScreenY = ((1 - ndcY) / 2) * size.height;

      const tempVec = new THREE.Vector3();
      
      const projectToScreen = (ra: number, dec: number): { x: number; y: number } | null => {
        const hz = equatorialToHorizontal(ra, dec, observer, simulationTime);
        if (hz.altitude < -2) return null;

        const altRad = (hz.altitude * Math.PI) / 180;
        const azRad = (hz.azimuth * Math.PI) / 180;
        
        const y = Math.sin(altRad) * 500;
        const xzLen = Math.cos(altRad) * 500;
        const x = Math.sin(azRad) * xzLen;
        const z = -Math.cos(azRad) * xzLen;

        tempVec.set(x, y, z);
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

        const screen = projectToScreen(star.ra, star.dec);
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

        const screen = projectToScreen(dso.ra, dso.dec);
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
    [camera, gl, size]
  );

  // Event listeners
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
