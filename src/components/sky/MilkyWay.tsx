import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Renders a Milky Way nebula background as a textured sphere.
 * Creates a high-quality procedural Milky Way effect matching Stellarium Web.
 * Uses realistic galactic coordinates and multi-layered noise for authentic appearance.
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
  
  // High quality hash functions
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  
  float hash3(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  
  // Smooth noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0); // Quintic interpolation
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  // 3D noise for volumetric effects
  float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    return mix(
      mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x),
          mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
          mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z
    );
  }
  
  // Simplified FBM for better performance (4 octaves instead of 8)
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  // Simplified turbulence (3 octaves instead of 6)
  float turbulence(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    
    for (int i = 0; i < 3; i++) {
      value += amplitude * abs(noise(p) * 2.0 - 1.0);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  void main() {
    vec3 dir = normalize(vPosition);
    
    // Convert to galactic coordinates
    // Galactic center is roughly at RA=17h45m, Dec=-29° (Sagittarius)
    // We rotate to approximate this
    float galLon = atan(dir.z, dir.x) + 1.5; // Offset to center on galactic center
    float galLat = asin(dir.y);
    
    // Main Milky Way band - Gaussian profile
    float bandWidth = 0.25; // ~15 degrees half-width
    float band = exp(-galLat * galLat / (2.0 * bandWidth * bandWidth));
    
    // Asymmetric bulge toward galactic center
    float bulge = exp(-pow(galLon, 2.0) * 0.3) * exp(-galLat * galLat * 8.0);
    bulge *= 1.5;
    
    // Spiral arm structure
    vec2 armCoord = vec2(galLon * 2.0, galLat * 8.0);
    float arms = 0.0;
    arms += sin(galLon * 4.0 + fbm(armCoord * 0.5) * 2.0) * 0.3;
    arms += sin(galLon * 6.0 - fbm(armCoord * 0.7 + 50.0) * 1.5) * 0.2;
    arms = (arms + 0.5) * band;
    
    // Multi-scale nebula structure
    vec2 noiseCoord = vec2(galLon * 4.0, galLat * 10.0);
    float n1 = fbm(noiseCoord * 1.5);
    float n2 = fbm(noiseCoord * 3.0 + 31.7);
    float n3 = fbm(noiseCoord * 6.0 + 67.3);
    float n4 = fbm(noiseCoord * 12.0 + 123.4);
    
    // Dark dust lanes (absorption)
    float dust = turbulence(noiseCoord * 2.0);
    float darkLanes = smoothstep(0.3, 0.7, dust) * band * 0.6;
    
    // Combine structure
    float nebula = band * (0.5 + 0.3 * n1 + 0.2 * n2 + 0.1 * n3);
    nebula += bulge * 0.4;
    nebula += arms * 0.3;
    nebula = max(0.0, nebula - darkLanes * 0.5);
    nebula = pow(nebula, 1.3);
    
    // Stellarium-style color palette
    vec3 coreColor = vec3(0.95, 0.90, 0.80);    // Warm white core
    vec3 innerColor = vec3(0.70, 0.55, 0.40);   // Golden inner regions
    vec3 midColor = vec3(0.25, 0.22, 0.35);     // Purple-blue mid regions
    vec3 outerColor = vec3(0.08, 0.10, 0.18);   // Deep blue outer
    vec3 dustColor = vec3(0.02, 0.02, 0.03);    // Near-black dust
    
    // Color mixing based on intensity and position
    float intensity = nebula + bulge * 0.5;
    vec3 nebulaColor = mix(outerColor, midColor, smoothstep(0.0, 0.3, intensity));
    nebulaColor = mix(nebulaColor, innerColor, smoothstep(0.3, 0.6, intensity));
    nebulaColor = mix(nebulaColor, coreColor, smoothstep(0.6, 1.0, intensity) * bulge);
    
    // Apply dust lane darkening
    nebulaColor = mix(nebulaColor, dustColor, darkLanes * 0.7);
    
    // Unresolved star field (millions of faint stars)
    float starField = noise(noiseCoord * 100.0);
    starField = pow(starField, 12.0) * band * 0.4;
    
    // Bright star clusters
    float clusters = noise(noiseCoord * 30.0 + 200.0);
    clusters = pow(clusters, 20.0) * band * 0.6;
    
    // Emission nebulae (HII regions - pink/red)
    float emission = fbm(noiseCoord * 2.5 + 150.0);
    emission = pow(max(0.0, emission - 0.5) * 2.0, 2.0) * band * 0.25;
    vec3 emissionColor = vec3(0.8, 0.2, 0.3);
    
    // Reflection nebulae (blue)
    float reflection = fbm(noiseCoord * 3.0 + 250.0);
    reflection = pow(max(0.0, reflection - 0.55) * 2.2, 2.0) * band * 0.15;
    vec3 reflectionColor = vec3(0.3, 0.4, 0.8);
    
    // Final composition
    vec3 color = nebulaColor * nebula;
    color += vec3(1.0, 0.98, 0.95) * starField;
    color += vec3(1.0, 0.95, 0.85) * clusters;
    color += emissionColor * emission;
    color += reflectionColor * reflection;
    
    // Subtle zodiacal light (very faint glow along ecliptic)
    float ecliptic = exp(-pow(galLat - 0.4, 2.0) * 3.0) * 0.02;
    color += vec3(0.15, 0.12, 0.08) * ecliptic;
    
    // Ambient deep space glow
    color += vec3(0.005, 0.007, 0.012);
    
    float alpha = clamp(nebula * 0.9 + starField + clusters * 0.5 + 0.03, 0.0, 1.0);
    
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

  return <mesh geometry={geometry} material={material} raycast={() => {}} />;
}
