import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import starsData from '../../data/stars.json';
import { raDecToCartesian, magnitudeToSize, spectralToColor } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';
import type { Star } from '../../types';

const stars = starsData as Star[];

// Enhanced star shader with twinkling and diffraction spikes
const starVertexShader = `
  attribute float size;
  attribute vec3 starColor;
  attribute float twinkleOffset;
  
  uniform float time;
  
  varying vec3 vColor;
  varying float vBrightness;
  
  void main() {
    vColor = starColor;
    
    // Twinkling effect - subtle size variation
    float twinkle = 1.0 + 0.15 * sin(time * 1.5 + twinkleOffset * 6.28) 
                        + 0.1 * sin(time * 3.7 + twinkleOffset * 12.56);
    
    vBrightness = twinkle;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Scale size based on camera FOV, not distance (since we're inside sphere)
    // Using large multiplier for visibility on retina displays (2x pixel ratio)
    gl_PointSize = size * twinkle * 6.0;
    gl_PointSize = max(gl_PointSize, 2.0);
    gl_PointSize = min(gl_PointSize, 48.0);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  varying float vBrightness;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    // Multi-layered glow for realistic star appearance
    // Inner bright core
    float core = exp(-dist * dist * 40.0);
    // Middle glow
    float glow = exp(-dist * dist * 8.0) * 0.6;
    // Outer halo
    float halo = exp(-dist * dist * 3.0) * 0.2;
    
    // Combine layers
    float intensity = core + glow + halo;
    intensity *= vBrightness;
    
    // White-hot core that fades to star color
    vec3 coreColor = mix(vColor, vec3(1.0), core * 0.8);
    vec3 finalColor = coreColor * intensity;
    
    // Subtle diffraction cross for bright stars
    float crossX = exp(-abs(center.y) * 60.0) * exp(-abs(center.x) * 8.0) * 0.15;
    float crossY = exp(-abs(center.x) * 60.0) * exp(-abs(center.y) * 8.0) * 0.15;
    finalColor += vec3(1.0) * (crossX + crossY) * vBrightness;
    
    float alpha = clamp(intensity + crossX + crossY, 0.0, 1.0);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export default function StarField() {
  const meshRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const magnitudeFilter = useAppStore((s) => s.settings.magnitudeFilter);

  const { geometry, material } = useMemo(() => {
    const filteredStars = stars.filter((s) => s.mag <= magnitudeFilter);
    const count = filteredStars.length;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const twinkleOffsets = new Float32Array(count);

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
      twinkleOffsets[i] = Math.random(); // Random phase offset for twinkling
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('starColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('twinkleOffset', new THREE.BufferAttribute(twinkleOffsets, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        time: { value: 0 },
      },
    });

    return { geometry: geo, material: mat };
  }, [magnitudeFilter]);

  // Animate twinkling
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <primitive object={material} ref={matRef} attach="material" />
    </points>
  );
}
