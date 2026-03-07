import { useMemo } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { calculatePlanetPositions, raDecToCartesian } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';

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
  const groupRef = useRef<THREE.Group>(null);

  const planets = useMemo(() => {
    return calculatePlanetPositions(observer, new Date());
  }, [observer]);

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 20, 10]} intensity={2} color="#ffffff" />
      
      {planets.map((planet) => {
        const [x, y, z] = raDecToCartesian(planet.ra, planet.dec, 495);
        const color = PLANET_COLORS[planet.name] || '#ffffff';
        const size = PLANET_SIZES[planet.name] || 4;

        return (
          <group key={planet.name} position={[x, y, z]}>
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
