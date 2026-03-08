import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { raDecToCartesian, magnitudeToSize, spectralToColor } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';
import { useCatalogStore } from '../../store/useCatalogStore';

function getStableTwinkleOffset(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

// Stellarium-quality star shader with realistic rendering
const starVertexShader = `
  attribute float size;
  attribute vec3 starColor;
  attribute float twinkleOffset;
  attribute float magnitude;
  
  uniform float time;
  uniform float fov;
  
  varying vec3 vColor;
  varying float vBrightness;
  varying float vSize;
  varying float vMagnitude;
  
  void main() {
    vColor = starColor;
    vMagnitude = magnitude;
    
    // Atmospheric scintillation (twinkling) - more pronounced for bright stars
    float twinkleStrength = 0.08 + 0.12 * (1.0 - magnitude / 6.5);
    float twinkle = 1.0 + twinkleStrength * sin(time * 2.0 + twinkleOffset * 6.28) 
                        + twinkleStrength * 0.5 * sin(time * 5.3 + twinkleOffset * 12.56)
                        + twinkleStrength * 0.3 * sin(time * 8.7 + twinkleOffset * 25.12);
    
    vBrightness = twinkle;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // FOV-adaptive sizing - stars appear larger when zoomed in
    float fovFactor = 75.0 / max(fov, 5.0);
    fovFactor = pow(fovFactor, 0.5); // Soften the scaling
    
    // Base size with FOV scaling
    float baseSize = size * 5.0 * fovFactor;
    
    gl_PointSize = baseSize * twinkle;
    gl_PointSize = max(gl_PointSize, 1.5);
    gl_PointSize = min(gl_PointSize, 64.0);
    
    vSize = gl_PointSize;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  varying float vBrightness;
  varying float vSize;
  varying float vMagnitude;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    // Stellarium-style star rendering with Airy disk approximation
    // Bright stars get more complex rendering
    float isBright = smoothstep(3.0, -1.0, vMagnitude);
    
    // Core - sharp central peak (Airy disk first maximum)
    float coreWidth = 50.0 - isBright * 20.0;
    float core = exp(-dist * dist * coreWidth);
    
    // First diffraction ring
    float ring1 = exp(-pow(dist - 0.15, 2.0) * 200.0) * 0.15 * isBright;
    
    // Soft glow (seeing disk)
    float glowWidth = 10.0 - isBright * 4.0;
    float glow = exp(-dist * dist * glowWidth) * 0.5;
    
    // Extended halo for very bright stars
    float halo = exp(-dist * dist * 2.5) * 0.15 * isBright;
    
    // Combine intensity layers
    float intensity = core + ring1 + glow + halo;
    intensity *= vBrightness;
    
    // Color temperature gradient - white hot core fading to spectral color
    float coreBlend = pow(core, 0.5);
    vec3 hotWhite = vec3(1.0, 0.98, 0.95);
    vec3 coreColor = mix(vColor, hotWhite, coreBlend * 0.9);
    
    // Final color with intensity
    vec3 finalColor = coreColor * intensity;
    
    // Diffraction spikes for bright stars (4-point cross)
    if (isBright > 0.3) {
      float spikeIntensity = isBright * 0.2 * vBrightness;
      
      // Horizontal spike
      float spikeH = exp(-abs(center.y) * 80.0) * exp(-abs(center.x) * 6.0);
      // Vertical spike  
      float spikeV = exp(-abs(center.x) * 80.0) * exp(-abs(center.y) * 6.0);
      // Diagonal spikes (for extra realism)
      vec2 rotated = vec2(center.x + center.y, center.x - center.y) * 0.707;
      float spikeD1 = exp(-abs(rotated.y) * 100.0) * exp(-abs(rotated.x) * 8.0) * 0.5;
      float spikeD2 = exp(-abs(rotated.x) * 100.0) * exp(-abs(rotated.y) * 8.0) * 0.5;
      
      float spikes = (spikeH + spikeV + spikeD1 + spikeD2) * spikeIntensity;
      finalColor += hotWhite * spikes;
      intensity += spikes;
    }
    
    // Chromatic aberration for very bright stars (subtle color fringing)
    if (isBright > 0.7 && dist > 0.1) {
      float chromatic = exp(-dist * dist * 15.0) * 0.05 * isBright;
      finalColor.r += chromatic * 1.2;
      finalColor.b += chromatic * 0.8;
    }
    
    float alpha = clamp(intensity, 0.0, 1.0);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export default function StarField() {
  const meshRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const magnitudeFilter = useAppStore((s) => s.settings.magnitudeFilter);
  const currentFov = useAppStore((s) => s.currentFov);
  const stars = useCatalogStore((s) => s.stars);

  const { geometry, material } = useMemo(() => {
    const filteredStars = stars.filter((s) => s.mag <= magnitudeFilter);
    const count = filteredStars.length;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const twinkleOffsets = new Float32Array(count);
    const magnitudes = new Float32Array(count);

    filteredStars.forEach((star, i) => {
      const [x, y, z] = raDecToCartesian(star.ra, star.dec, 500);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const [r, g, b] = spectralToColor(star.spectral);
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;

      sizes[i] = magnitudeToSize(star.mag);
      twinkleOffsets[i] = getStableTwinkleOffset(star.hip);
      magnitudes[i] = star.mag;
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('starColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets, 1));
    geo.setAttribute('magnitude', new THREE.BufferAttribute(magnitudes, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        time: { value: 0 },
        fov: { value: 75 },
      },
    });

    return { geometry: geo, material: mat };
  }, [magnitudeFilter, stars]);

  // Animate twinkling and update FOV
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.time.value = clock.getElapsedTime();
      matRef.current.uniforms.fov.value = currentFov;
    }
  });

  return (
    <points ref={meshRef} geometry={geometry} raycast={() => {}}>
      <primitive object={material} ref={matRef} attach="material" />
    </points>
  );
}
