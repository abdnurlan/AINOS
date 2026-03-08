import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import StarField from './StarField';
import ConstellationLines from './ConstellationLines';
import Planets from './Planets';
import MilkyWay from './MilkyWay';
import DSOField from './DSOField';
// LaserBeam removed - laser is controlled by backend hardware
import ClickableStars from './ClickableStars';
import CoordinateGrid from './CoordinateGrid';
import CameraController from './CameraController';
import Atmosphere from './Atmosphere';
import StarLabels from './StarLabels';
import ConstellationLabels from './ConstellationLabels';
import Ground from './Ground';
import CardinalLabels from './CardinalLabels';
import { useAppStore } from '../../store/useAppStore';
import { getLocalSiderealTime } from '../../utils/astronomy';

/**
 * Sky rotation group — rotates the celestial sphere based on
 * local sidereal time, simulating Earth's rotation.
 */
function SkyRotation({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const observer = useAppStore((s) => s.observer);
  const simulationTime = useAppStore((s) => s.simulationTime);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const timeSpeed = useAppStore((s) => s.timeSpeed);
  const setSimulationTime = useAppStore((s) => s.setSimulationTime);

  // Use ref for high-frequency time tracking to avoid re-rendering React tree every frame
  const timeRef = useRef(simulationTime.getTime());
  const lastSyncRef = useRef(0);

  useFrame((_, delta) => {
    // Advance simulation time in ref (no React re-render)
    if (isPlaying) {
      timeRef.current += delta * 1000 * timeSpeed;
    } else {
      timeRef.current = simulationTime.getTime();
    }

    // Sync React state only once per second (for UI display)
    lastSyncRef.current += delta;
    if (lastSyncRef.current > 1.0 && isPlaying) {
      lastSyncRef.current = 0;
      setSimulationTime(new Date(timeRef.current));
    }

    // Rotate sky based on Local Sidereal Time using ref time (no re-render)
    if (groupRef.current) {
      const lst = getLocalSiderealTime(observer, new Date(timeRef.current));
      const rotAngle = (lst / 24) * Math.PI * 2;
      const latRad = (observer.latitude * Math.PI) / 180;
      
      groupRef.current.rotation.set(0, 0, 0);
      groupRef.current.rotateY(-rotAngle);
      groupRef.current.rotateX(-(Math.PI / 2 - latRad));
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

/**
 * CameraManager — handles true FOV zooming and tracks camera Alt/Az
 */
function CameraManager() {
  const setCurrentFov = useAppStore((s) => s.setCurrentFov);
  const setCameraPosition = useAppStore((s) => s.setCameraPosition);
  const { camera, gl } = useThree();

  // Custom FOV Zoom
  useEffect(() => {
    const canvas = gl.domElement;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!('fov' in camera)) return;
      const perspCamera = camera as THREE.PerspectiveCamera;
      const zoomSpeed = 0.05;
      let newFov = perspCamera.fov;
      
      if (e.deltaY > 0) {
        newFov *= (1 + zoomSpeed); // Zoom out
      } else {
        newFov *= (1 - zoomSpeed); // Zoom in
      }
      
      // Clamp FOV between 5 and 120 degrees
      newFov = Math.max(5, Math.min(newFov, 120));
      perspCamera.fov = newFov;
      perspCamera.updateProjectionMatrix();
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [camera, gl.domElement]);

  // Alt/Az and FOV Tracking
  useFrame(() => {
    if ('fov' in camera) {
      const perspCamera = camera as THREE.PerspectiveCamera;
      setCurrentFov(Math.round(perspCamera.fov));
    }
    
    // Look direction in world space
    const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    
    // Altitude: angle from XZ plane (-90 to +90)
    const alt = Math.asin(lookDir.y) * (180 / Math.PI);
    
    // Azimuth: angle from North (N=0, E=90, S=180, W=270)
    // N is (0,0,-1)
    let az = Math.atan2(lookDir.x, -lookDir.z) * (180 / Math.PI);
    if (az < 0) az += 360;
    
    setCameraPosition(Math.round(alt * 10) / 10, Math.round(az * 10) / 10);
  });
  
  return null;
}

export default function SkyScene() {
  const showGround = useAppStore((s) => s.showGround);
  const showAtmosphere = useAppStore((s) => s.showAtmosphere);
  const showCardinalPoints = useAppStore((s) => s.showCardinalPoints);

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          fov: 75,
          near: 0.1,
          far: 2000,
          position: [0, 0, 0.01],
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: 0,
        }}
        dpr={[1, 1.5]}
      >
        {/* Deep space background */}
        <color attach="background" args={['#020408']} />

        {/* Milky Way nebula background (outermost layer) */}
        <SkyRotation>
          <MilkyWay />

          {/* Stars (main visual layer) */}
          <Suspense fallback={null}>
            <StarField />
            <DSOField />
            <ConstellationLines />
            <StarLabels />
            <ConstellationLabels />
            <CoordinateGrid />
            {/* Clickable layers last so raycast hits them first */}
            <ClickableStars />
            <Planets />
          </Suspense>
        </SkyRotation>

        {/* LaserBeam removed - laser is controlled by backend hardware */}

        {/* Atmospheric horizon glow (not rotated — fixed to observer) */}
        {showAtmosphere && <Atmosphere />}

        {/* Ground plane (fixed to observer) */}
        {showGround && <Ground />}

        {/* Cardinal direction labels (fixed to observer) */}
        {showCardinalPoints && <CardinalLabels />}

        {/* Camera control */}
        <CameraController />
        <CameraManager />
        <OrbitControls
          enablePan={false}
          enableZoom={false} // Disabled dolly zoom in favor of FOV zoom
          enableDamping={true}
          dampingFactor={0.06}
          rotateSpeed={-0.25}
          zoomSpeed={1.2}
          enableRotate={true}
          minDistance={0.01}
          maxDistance={0.01}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
