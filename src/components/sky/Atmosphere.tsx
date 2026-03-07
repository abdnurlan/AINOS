import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Renders a subtle atmospheric glow at the horizon.
 * Creates the appearance of atmospheric scattering at low altitudes.
 */

const atmosphereVertexShader = `
  varying vec3 vPosition;
  
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vPosition;
  
  void main() {
    vec3 dir = normalize(vPosition);
    
    // Horizon glow - strongest when looking horizontally
    float horizonFactor = 1.0 - abs(dir.y);
    horizonFactor = pow(horizonFactor, 8.0);
    
    // Only below the horizon
    float belowHorizon = smoothstep(0.05, -0.1, dir.y);
    
    // Color: warm near horizon, cool above
    vec3 horizonColor = vec3(0.04, 0.06, 0.15); // Deep blue
    vec3 groundColor = vec3(0.02, 0.02, 0.04);   // Very dark
    
    vec3 color = mix(groundColor, horizonColor, horizonFactor);
    float alpha = horizonFactor * 0.3 + belowHorizon * 0.15;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function Atmosphere() {
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.SphereGeometry(560, 32, 16);
    const mat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: geo, material: mat };
  }, []);

  return <mesh geometry={geometry} material={material} />;
}
