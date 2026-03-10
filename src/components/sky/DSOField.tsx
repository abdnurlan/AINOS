import { useMemo, useRef, useCallback } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { raDecToCartesian, equatorialToHorizontal } from '../../utils/astronomy';
import { useAppStore } from '../../store/useAppStore';
import { useCatalogStore } from '../../store/useCatalogStore';
import type { DSO, DSOType } from '../../types';

// DSO type to color mapping (Stellarium-style)
const DSO_COLORS: Record<DSOType, string> = {
  galaxy: '#ff9966',
  galaxy_pair: '#ff9966',
  galaxy_triplet: '#ff9966',
  galaxy_group: '#ff9966',
  globular_cluster: '#ffff66',
  open_cluster: '#66ff66',
  cluster_nebula: '#66ffcc',
  planetary_nebula: '#66ccff',
  emission_nebula: '#ff6699',
  reflection_nebula: '#6699ff',
  dark_nebula: '#996633',
  nebula: '#cc99ff',
  hii_region: '#ff6699',
  supernova_remnant: '#ff3366',
  nova: '#ff0066',
  stellar_association: '#99ff99',
  star: '#ffffff',
  double_star: '#ffcc66',
  other: '#cccccc',
  unknown: '#999999',
};

// DSO type to size multiplier
const DSO_SIZE_MULTIPLIER: Record<DSOType, number> = {
  galaxy: 1.5,
  galaxy_pair: 1.3,
  galaxy_triplet: 1.4,
  galaxy_group: 1.6,
  globular_cluster: 1.2,
  open_cluster: 1.4,
  cluster_nebula: 1.3,
  planetary_nebula: 0.8,
  emission_nebula: 1.8,
  reflection_nebula: 1.5,
  dark_nebula: 1.6,
  nebula: 1.5,
  hii_region: 1.6,
  supernova_remnant: 1.2,
  nova: 0.6,
  stellar_association: 1.3,
  star: 0.5,
  double_star: 0.6,
  other: 0.8,
  unknown: 0.7,
};

// Check if DSO type is a nebula
function isNebula(type: DSOType): boolean {
  return [
    'planetary_nebula',
    'emission_nebula',
    'reflection_nebula',
    'dark_nebula',
    'nebula',
    'hii_region',
    'supernova_remnant',
    'cluster_nebula',
  ].includes(type);
}

// Check if DSO type is a galaxy
function isGalaxy(type: DSOType): boolean {
  return ['galaxy', 'galaxy_pair', 'galaxy_triplet', 'galaxy_group'].includes(type);
}

// Check if DSO type is a cluster
function isCluster(type: DSOType): boolean {
  return ['globular_cluster', 'open_cluster', 'stellar_association'].includes(type);
}

// DSO shader for fuzzy extended objects
const dsoVertexShader = `
  attribute float size;
  attribute vec3 dsoColor;
  attribute float dsoType;
  
  varying vec3 vColor;
  varying float vType;
  varying float vWorldY;
  
  void main() {
    vColor = dsoColor;
    vType = dsoType;
    
    // World position after sky rotation
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldY = worldPos.y;
    
    // Hide below horizon
    if (worldPos.y < -5.0) {
      gl_PointSize = 0.0;
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }
    
    float horizonFade = smoothstep(-5.0, 0.0, worldPos.y);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * 4.0 * horizonFade;
    gl_PointSize = max(gl_PointSize, 4.0);
    gl_PointSize = min(gl_PointSize, 64.0);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const dsoFragmentShader = `
  varying vec3 vColor;
  varying float vType;
  varying float vWorldY;
  
  void main() {
    // Discard below-horizon DSOs
    if (vWorldY < -5.0) discard;
    
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    // Different rendering based on type
    float intensity;
    
    if (vType < 4.0) {
      // Galaxies - elliptical glow
      float ellipse = length(center * vec2(1.0, 1.5));
      intensity = exp(-ellipse * ellipse * 6.0);
    } else if (vType < 8.0) {
      // Clusters - granular appearance
      float grain = sin(center.x * 40.0) * sin(center.y * 40.0) * 0.1;
      intensity = exp(-dist * dist * 8.0) + grain * exp(-dist * 4.0);
    } else {
      // Nebulae - soft diffuse glow
      intensity = exp(-dist * dist * 4.0) * 0.8;
      intensity += exp(-dist * dist * 12.0) * 0.4;
    }
    
    vec3 finalColor = vColor * intensity;
    float alpha = clamp(intensity, 0.0, 0.9);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Map DSO type to numeric value for shader
function dsoTypeToNumber(type: DSOType): number {
  if (isGalaxy(type)) return 0;
  if (isCluster(type)) return 4;
  if (isNebula(type)) return 8;
  return 12;
}

// Calculate DSO visual size based on magnitude and angular size
function calculateDSOSize(dso: DSO): number {
  const baseMag = dso.mag ?? 10;
  const magSize = Math.max(1, (14 - baseMag) / 2);
  
  // Factor in angular size if available
  const angularSize = dso.majorAxis ?? 1;
  const sizeBonus = Math.min(angularSize / 10, 3);
  
  const typeMultiplier = DSO_SIZE_MULTIPLIER[dso.type] ?? 1;
  
  return (magSize + sizeBonus) * typeMultiplier;
}

export default function DSOField() {
  const meshRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  
  const settings = useAppStore((s) => s.settings);
  const setSelectedObject = useAppStore((s) => s.setSelectedObject);
  const observer = useAppStore((s) => s.observer);
  const simulationTime = useAppStore((s) => s.simulationTime);
  
  const dsoObjects = useCatalogStore((s) => s.dsoObjects);

  const handleDSOClick = useCallback((dso: DSO, e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const hz = equatorialToHorizontal(dso.ra, dso.dec, observer, simulationTime);
    
    setSelectedObject({
      id: `dso-${dso.id}`,
      name: dso.commonName 
        ? `${dso.displayName} (${dso.commonName.split(',')[0]})`
        : dso.displayName,
      type: 'dso',
      ra: dso.ra,
      dec: dso.dec,
      azimuth: hz.azimuth,
      altitude: hz.altitude,
      magnitude: dso.mag ?? undefined,
      constellation: dso.constellation || undefined,
    });
  }, [setSelectedObject, observer, simulationTime]);

  const filteredDSOs = useMemo(() => {
    if (!settings.showDSO) return [];
    
    return dsoObjects.filter((dso) => {
      // Magnitude filter
      if (dso.mag !== null && dso.mag > settings.dsoMagnitudeFilter) return false;
      
      // Type filters
      if (isNebula(dso.type) && !settings.showNebulae) return false;
      if (isGalaxy(dso.type) && !settings.showGalaxies) return false;
      if (isCluster(dso.type) && !settings.showClusters) return false;
      
      return true;
    });
  }, [dsoObjects, settings]);

  const { geometry, material } = useMemo(() => {
    const count = filteredDSOs.length;
    if (count === 0) {
      return { geometry: null, material: null };
    }

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const types = new Float32Array(count);

    filteredDSOs.forEach((dso, i) => {
      const [x, y, z] = raDecToCartesian(dso.ra, dso.dec, 498);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const color = new THREE.Color(DSO_COLORS[dso.type] || '#cccccc');
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = calculateDSOSize(dso);
      types[i] = dsoTypeToNumber(dso.type);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('dsoColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('dsoType', new THREE.BufferAttribute(types, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: dsoVertexShader,
      fragmentShader: dsoFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, [filteredDSOs]);

  // ALL filtered DSOs that are above horizon are clickable
  const clickableDSOs = useMemo(() => {
    return filteredDSOs.filter((dso) => {
      const hz = equatorialToHorizontal(dso.ra, dso.dec, observer, simulationTime);
      return hz.altitude > -2;
    });
  }, [filteredDSOs, observer, simulationTime]);

  // Pre-compute positions for labels (render labels for all clickable DSOs, limited for performance)
  const labelData = useMemo(() => {
    if (!settings.showDSOLabels) return [];
    return clickableDSOs.slice(0, 80).map((dso) => ({
      dso,
      position: raDecToCartesian(dso.ra, dso.dec, 497) as [number, number, number],
      color: DSO_COLORS[dso.type] || '#cccccc',
      label: dso.messier ? `M${dso.messier}` : dso.displayName,
    }));
  }, [clickableDSOs, settings.showDSOLabels]);


  if (!geometry || !material || filteredDSOs.length === 0) {
    return null;
  }

  return (
    <group>
      <points ref={meshRef} geometry={geometry} raycast={() => {}}>
        <primitive object={material} ref={matRef} attach="material" />
      </points>

      {/* DSO Labels */}
      {labelData.map(({ dso, position, color, label }) => (
        <Billboard 
          key={dso.id} 
          position={position}
          onClick={(e: ThreeEvent<MouseEvent>) => handleDSOClick(dso, e)}
        >
          <Text
            fontSize={3}
            color={color}
            anchorX="center"
            anchorY="bottom"
            fillOpacity={0.7}
            outlineWidth={0.1}
            outlineColor="#000000"
          >
            {label}
          </Text>
        </Billboard>
      ))}
    </group>
  );
}
