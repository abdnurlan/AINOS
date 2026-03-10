import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Renders a realistic ground plane at the horizon with terrain coloring,
 * tree/hill silhouettes, and opaque filling below horizon.
 * Stellarium-style: solid ground that fully blocks below-horizon objects.
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
    
    // Angle from horizon and azimuth
    float angle = atan(dir.z, dir.x);
    float horizonDist = abs(dir.y);
    
    // Tree/hill silhouette at horizon edge
    float silhouetteNoise = fbm(vec2(angle * 8.0, 0.0)) * 0.03;
    float treeDetail = fbm(vec2(angle * 40.0, 0.0)) * 0.008;
    float silhouette = smoothstep(0.0, 0.02 + silhouetteNoise + treeDetail, -dir.y);
    
    // === REALISTIC TERRAIN COLORS ===
    // Night terrain palette
    float terrainNoise1 = fbm(vec2(angle * 15.0, horizonDist * 20.0));
    float terrainNoise2 = fbm(vec2(angle * 30.0, horizonDist * 40.0 + 50.0));
    float terrainNoise3 = fbm(vec2(angle * 5.0, horizonDist * 10.0 + 100.0));
    
    // Base terrain colors (green grass meadow)
    vec3 darkGrass = vec3(0.08, 0.18, 0.04);       // Green grass
    vec3 dryGrass = vec3(0.12, 0.16, 0.04);         // Yellow-green grass
    vec3 soil = vec3(0.10, 0.08, 0.04);              // Brown soil patches
    vec3 rock = vec3(0.10, 0.10, 0.09);              // Grey rock
    vec3 deepGround = vec3(0.05, 0.10, 0.03);        // Darker green below
    
    // Mix terrain types based on noise
    vec3 groundColor = mix(darkGrass, dryGrass, smoothstep(0.3, 0.7, terrainNoise1));
    groundColor = mix(groundColor, soil, smoothstep(0.4, 0.8, terrainNoise2) * 0.5);
    groundColor = mix(groundColor, rock, smoothstep(0.6, 0.9, terrainNoise3) * 0.3);
    
    // Depth gradient — further below horizon gets darker
    groundColor = mix(groundColor, deepGround, smoothstep(0.0, 0.5, horizonDist));
    
    // Subtle terrain variation (patches of lighter/darker areas)
    float patchNoise = fbm(vec2(angle * 20.0, horizonDist * 30.0));
    groundColor += vec3(patchNoise * 0.01, patchNoise * 0.012, patchNoise * 0.005);
    
    // Horizon glow (warm atmospheric scattering at ground level)
    float horizonGlow = exp(-horizonDist * 15.0) * 0.12;
    vec3 horizonColor = vec3(0.06, 0.08, 0.12); // Slight blue-grey atmospheric glow
    groundColor += horizonColor * horizonGlow;
    
    // Slight warm tint near horizon (city light pollution effect)
    float cityGlow = exp(-horizonDist * 20.0) * 0.04;
    groundColor += vec3(0.08, 0.05, 0.02) * cityGlow * (0.5 + 0.5 * sin(angle * 3.0));
    
    // FULLY OPAQUE — blocks all objects below horizon
    float alpha = silhouette;
    
    gl_FragColor = vec4(groundColor, alpha);
  }
`;

export default function Ground() {
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.SphereGeometry(498, 64, 32);
    const mat = new THREE.ShaderMaterial({
      vertexShader: groundVertexShader,
      fragmentShader: groundFragmentShader,
      transparent: true,
      depthWrite: true, // Write depth to block objects behind ground
      side: THREE.BackSide,
    });
    return { geometry: geo, material: mat };
  }, []);

  return <mesh geometry={geometry} material={material} raycast={() => {}} />;
}
