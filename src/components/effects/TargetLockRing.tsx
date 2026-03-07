import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { raDecToCartesian } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';

const ringVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFragmentShader = `
  uniform float time;
  uniform vec3 color;
  varying vec2 vUv;
  
  void main() {
    vec2 center = vec2(0.5);
    float dist = length(vUv - center) * 2.0;
    
    // Multiple concentric rings
    float ring1 = smoothstep(0.6, 0.62, dist) * (1.0 - smoothstep(0.63, 0.65, dist));
    float ring2 = smoothstep(0.75, 0.77, dist) * (1.0 - smoothstep(0.78, 0.80, dist));
    float ring3 = smoothstep(0.90, 0.92, dist) * (1.0 - smoothstep(0.93, 0.95, dist));
    
    // Rotating dash pattern
    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
    float dash = sin(angle * 8.0 + time * 2.0) * 0.5 + 0.5;
    float dash2 = sin(angle * 12.0 - time * 3.0) * 0.5 + 0.5;
    
    float alpha = ring1 * dash + ring2 * dash2 * 0.7 + ring3 * 0.3;
    alpha *= 0.8;
    
    // Pulsing glow
    float glow = smoothstep(0.5, 0.0, dist) * 0.08 * (sin(time * 3.0) * 0.5 + 0.5);
    alpha += glow;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function TargetLockRing() {
  const selectedObject = useAppStore((s) => s.selectedObject);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
    if (meshRef.current) {
      meshRef.current.lookAt(0, 0, 0);
    }
  });

  if (!selectedObject) return null;

  const [x, y, z] = raDecToCartesian(selectedObject.ra, selectedObject.dec, 494);

  return (
    <mesh ref={meshRef} position={[x, y, z]}>
      <planeGeometry args={[30, 30]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={ringVertexShader}
        fragmentShader={ringFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        uniforms={{
          time: { value: 0 },
          color: { value: new THREE.Color('#3b82f6') },
        }}
      />
    </mesh>
  );
}
