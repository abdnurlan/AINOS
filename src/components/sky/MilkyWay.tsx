import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Renders a Milky Way nebula background as a textured sphere.
 * Creates a procedural nebula effect using layered noise patterns.
 */

const nebulaVertexShader = `
  varying vec3 vPosition;
  varying vec2 vUv;
  
  void main() {
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFragmentShader = `
  varying vec3 vPosition;
  varying vec2 vUv;
  
  // Simplex-like noise function
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
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }
  
  void main() {
    vec3 dir = normalize(vPosition);
    
    // Convert to galactic-ish coordinates
    float galLon = atan(dir.z, dir.x);
    float galLat = asin(dir.y);
    
    // Milky Way band - concentrated around galactic equator
    float band = exp(-galLat * galLat * 4.0);
    
    // Layered nebula noise
    vec2 noiseCoord = vec2(galLon * 3.0, galLat * 6.0);
    float n1 = fbm(noiseCoord * 2.0);
    float n2 = fbm(noiseCoord * 4.0 + 31.7);
    float n3 = fbm(noiseCoord * 8.0 + 67.3);
    
    // Combine noise layers for rich nebula structure
    float nebula = band * (0.4 * n1 + 0.3 * n2 + 0.15 * n3);
    nebula = pow(nebula, 1.5) * 1.2;
    
    // Color gradient: blue-purple core, warm edges
    vec3 coldColor = vec3(0.08, 0.12, 0.25);   // Deep blue
    vec3 midColor = vec3(0.15, 0.10, 0.22);     // Purple
    vec3 warmColor = vec3(0.18, 0.10, 0.08);    // Warm brown
    
    vec3 nebulaColor = mix(coldColor, midColor, n1);
    nebulaColor = mix(nebulaColor, warmColor, n2 * 0.5);
    
    // Star dust - tiny bright points in the band
    float dust = noise(noiseCoord * 50.0);
    dust = pow(dust, 8.0) * band * 0.3;
    
    // Emission regions (reddish nebula patches)
    float emission = fbm(noiseCoord * 3.0 + 100.0);
    emission = pow(emission, 3.0) * band * 0.15;
    vec3 emissionColor = vec3(0.3, 0.05, 0.08); // Dark red
    
    // Combine everything
    vec3 color = nebulaColor * nebula;
    color += vec3(1.0, 0.95, 0.9) * dust;
    color += emissionColor * emission;
    
    // Very subtle ambient glow everywhere
    color += vec3(0.01, 0.012, 0.02);
    
    float alpha = clamp(nebula * 0.8 + dust + 0.05, 0.0, 1.0);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function MilkyWay() {
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.SphereGeometry(550, 64, 32);
    const mat = new THREE.ShaderMaterial({
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    return { geometry: geo, material: mat };
  }, []);

  return <mesh geometry={geometry} material={material} />;
}
