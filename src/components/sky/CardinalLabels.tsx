import { useMemo } from 'react';
import { Billboard, Text } from '@react-three/drei';

/**
 * Renders cardinal direction labels (N, NE, E, SE, S, SW, W, NW)
 * at the horizon, Stellarium-style.
 */

interface CardinalPoint {
  label: string;
  azimuth: number; // degrees from North
  primary: boolean;
}

const CARDINAL_POINTS: CardinalPoint[] = [
  { label: 'N', azimuth: 0, primary: true },
  { label: 'NE', azimuth: 45, primary: false },
  { label: 'E', azimuth: 90, primary: true },
  { label: 'SE', azimuth: 135, primary: false },
  { label: 'S', azimuth: 180, primary: true },
  { label: 'SW', azimuth: 225, primary: false },
  { label: 'W', azimuth: 270, primary: true },
  { label: 'NW', azimuth: 315, primary: false },
];

export default function CardinalLabels() {
  const labels = useMemo(() => {
    const radius = 490;
    return CARDINAL_POINTS.map((cp) => {
      // Convert azimuth to RA/Dec-like position at horizon (altitude=0)
      // Azimuth: 0=N, 90=E, 180=S, 270=W
      const azRad = (cp.azimuth * Math.PI) / 180;
      
      // Place at horizon level (y ≈ 0) in a circle
      const x = radius * Math.sin(azRad);
      const z = -radius * Math.cos(azRad);
      const y = -5; // Slightly below horizon for visibility

      return {
        ...cp,
        position: [x, y, z] as [number, number, number],
      };
    });
  }, []);

  return (
    <group>
      {labels.map((cp) => (
        <Billboard key={cp.label} position={cp.position}>
          <Text
            fontSize={cp.primary ? 6 : 4}
            color={cp.primary ? '#e8a735' : '#c0984a'}
            anchorX="center"
            anchorY="middle"
            fillOpacity={cp.primary ? 0.9 : 0.5}
            outlineWidth={0.2}
            outlineColor="#000000"
            font={undefined}
          >
            {cp.label}
          </Text>
          {/* Small tick mark below label */}
          {cp.primary && (
            <mesh position={[0, -5, 0]}>
              <planeGeometry args={[0.5, 3]} />
              <meshBasicMaterial
                color="#e8a735"
                transparent
                opacity={0.4}
                depthWrite={false}
              />
            </mesh>
          )}
        </Billboard>
      ))}
      
      {/* Degree markers every 10° */}
      {Array.from({ length: 36 }, (_, i) => {
        const az = i * 10;
        if (az % 45 === 0) return null; // Skip cardinal points
        const azRad = (az * Math.PI) / 180;
        const radius = 490;
        const x = radius * Math.sin(azRad);
        const z = -radius * Math.cos(azRad);
        return (
          <Billboard key={`deg-${az}`} position={[x, -5, z]}>
            <Text
              fontSize={2.5}
              color="#888888"
              anchorX="center"
              anchorY="middle"
              fillOpacity={0.35}
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              {`${az}°`}
            </Text>
          </Billboard>
        );
      })}
    </group>
  );
}
