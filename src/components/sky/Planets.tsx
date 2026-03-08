import { useMemo, useCallback, useRef } from 'react';
import { Billboard, Text } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { calculatePlanetPositions, raDecToCartesian } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';
import type { CelestialObject } from '../../types';

const PLANET_COLORS: Record<string, string> = {
  Mercury: '#c0c0c8',
  Venus: '#fffacd',
  Mars: '#ff6347',
  Jupiter: '#f0d8a0',
  Saturn: '#fad57c',
  Uranus: '#6dd3ce',
  Neptune: '#4d7cc9',
  Moon: '#f0f0e0',
  Sun: '#ffd700',
};

const PLANET_SIZES: Record<string, number> = {
  Mercury: 3,
  Venus: 5,
  Mars: 4,
  Jupiter: 7,
  Saturn: 6,
  Uranus: 4,
  Neptune: 4,
  Moon: 8,
  Sun: 12,
};

export default function Planets() {
  const observer = useAppStore((s) => s.observer);
  const simulationTime = useAppStore((s) => s.simulationTime);
  const setSelectedObject = useAppStore((s) => s.setSelectedObject);
  const groupRef = useRef<THREE.Group>(null);

  const planets = useMemo(() => {
    return calculatePlanetPositions(observer, simulationTime);
  }, [observer, simulationTime]);

  const handlePlanetClick = useCallback(
    (
      planet: (typeof planets)[number],
      event: ThreeEvent<MouseEvent>
    ) => {
      event.stopPropagation();

      const objectType: CelestialObject['type'] =
        planet.name === 'Moon' ? 'moon' : planet.name === 'Sun' ? 'sun' : 'planet';

      const selectedObject: CelestialObject = {
        id: `planet-${planet.name.toLowerCase()}`,
        name: planet.name,
        type: objectType,
        ra: planet.ra,
        dec: planet.dec,
        azimuth: planet.azimuth,
        altitude: planet.altitude,
        magnitude: planet.magnitude,
        distance: `${planet.distance.toFixed(3)} AU`,
      };

      setSelectedObject(selectedObject);
    },
    [setSelectedObject]
  );

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 20, 10]} intensity={2} color="#ffffff" />
      
      {planets.map((planet) => {
        const [x, y, z] = raDecToCartesian(planet.ra, planet.dec, 495);
        const color = PLANET_COLORS[planet.name] || '#ffffff';
        const size = PLANET_SIZES[planet.name] || 4;

        return (
          <group
            key={planet.name}
            position={[x, y, z]}
            onClick={(event) => handlePlanetClick(planet, event)}
          >
            {/* Outer glow halo */}
            <Billboard>
              <mesh>
                <planeGeometry args={[size * 6, size * 6]} />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={0.08}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            </Billboard>

            {/* Middle glow ring */}
            <Billboard>
              <mesh>
                <planeGeometry args={[size * 3, size * 3]} />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={0.2}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            </Billboard>

            {/* True 3D Planet Sphere */}
            <mesh>
              <sphereGeometry args={[size * 0.8, 32, 32]} />
              <meshStandardMaterial
                color={color}
                roughness={0.6}
                metalness={0.1}
              />
            </mesh>

            <mesh>
              <sphereGeometry args={[size * 1.6, 16, 16]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Planet label */}
            <Billboard>
              <Text
                position={[0, size * 2, 0]}
                fontSize={4.5}
                color={color}
                anchorX="center"
                anchorY="bottom"
                fillOpacity={0.85}
                outlineWidth={0.15}
                outlineColor="#000000"
              >
                {planet.name}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}
