import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Renders a ground plane at the horizon with a procedural landscape silhouette.
 * Creates the Stellarium-like effect of standing on Earth looking up.
 */

const groundVertexShader = `
  varying vec3 vPosition;
  varying vec2 vUv;
  
  void main() {
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const groundFragmentShader = `
  varying vec3 vPosition;
  varying vec2 vUv;
  
  // Simple hash noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amp * noise(p);
      p *= 2.0;
      amp *= 0.5;
    }
    return value;
  }
  
  void main() {
    vec3 dir = normalize(vPosition);
    
    // Only render below horizon
    if (dir.y > 0.02) discard;
    
    // Angle from horizon
    float angle = atan(dir.z, dir.x);
    float horizonDist = abs(dir.y);
    
    // Tree/hill silhouette at horizon edge
    float silhouetteNoise = fbm(vec2(angle * 8.0, 0.0)) * 0.03;
    float silhouette = smoothstep(0.0, 0.025 + silhouetteNoise, -dir.y);
    
    // Ground color - dark green/brown gradient
    vec3 horizonColor = vec3(0.02, 0.04, 0.02); // Dark green at horizon
    vec3 groundColor = vec3(0.01, 0.015, 0.01);  // Very dark green below
    vec3 color = mix(horizonColor, groundColor, smoothstep(0.0, 0.3, horizonDist));
    
    // Subtle terrain variation
    float terrainNoise = fbm(vec2(angle * 20.0, horizonDist * 30.0)) * 0.02;
    color += vec3(terrainNoise * 0.5, terrainNoise, terrainNoise * 0.3);
    
    // Horizon glow (subtle atmospheric scattering at ground level)
    float horizonGlow = exp(-horizonDist * 15.0) * 0.08;
    color += vec3(0.05, 0.08, 0.12) * horizonGlow;
    
    float alpha = silhouette;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function Ground() {
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.SphereGeometry(498, 64, 32);
    const mat = new THREE.ShaderMaterial({
      vertexShader: groundVertexShader,
      fragmentShader: groundFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
    });
    return { geometry: geo, material: mat };
  }, []);

  return <mesh geometry={geometry} material={material} raycast={() => {}} />;
}
