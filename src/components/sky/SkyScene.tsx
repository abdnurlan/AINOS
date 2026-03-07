import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import StarField from './StarField';
import ConstellationLines from './ConstellationLines';
import Planets from './Planets';
import MilkyWay from './MilkyWay';
import TargetLockRing from '../effects/TargetLockRing';
import CelestialMarker from '../effects/CelestialMarker';
import ClickableStars from './ClickableStars';
import CoordinateGrid from './CoordinateGrid';
import CameraController from './CameraController';
import Atmosphere from './Atmosphere';
import StarLabels from './StarLabels';

export default function SkyScene() {
  return (
    <div className="w-full h-full absolute inset-0">
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
          toneMapping: 0, // No tone mapping — we want pure additive glow
        }}
        dpr={[1, 2]}
      >
        {/* Deep space background */}
        <color attach="background" args={['#020408']} />

        {/* Milky Way nebula background (outermost layer) */}
        <MilkyWay />

        {/* Atmospheric horizon glow */}
        <Atmosphere />

        {/* Stars (main visual layer) */}
        <Suspense fallback={null}>
          <StarField />
          <ConstellationLines />
          <Planets />
          <StarLabels />
          <ClickableStars />
          <CoordinateGrid />
        </Suspense>

        {/* Selection effects */}
        <TargetLockRing />
        <CelestialMarker />

        {/* Camera control */}
        <CameraController />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableDamping={true}
          dampingFactor={0.06}
          rotateSpeed={-0.25}
          zoomSpeed={1.2}
          enableRotate={true}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
