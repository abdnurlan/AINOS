import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';

/**
 * Renders realistic atmospheric scattering using Rayleigh and Mie models.
 * Simulates sky color based on sun position - blue sky during day, 
 * orange/red at sunset, dark at night. Matches Stellarium Web appearance.
 */

const atmosphereVertexShader = `
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  void main() {
    vPosition = position;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  uniform vec3 sunDirection;
  uniform float sunAltitude;
  
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  // Rayleigh scattering coefficients (wavelength dependent)
  const vec3 rayleighCoeff = vec3(5.8e-6, 13.5e-6, 33.1e-6); // RGB
  
  // Mie scattering coefficient (wavelength independent)
  const float mieCoeff = 21e-6;
  
  // Scale heights
  const float rayleighScaleHeight = 8500.0;
  const float mieScaleHeight = 1200.0;
  
  // Mie phase function parameter
  const float mieG = 0.76;
  
  // Rayleigh phase function
  float rayleighPhase(float cosTheta) {
    return 0.75 * (1.0 + cosTheta * cosTheta);
  }
  
  // Mie phase function (Henyey-Greenstein)
  float miePhase(float cosTheta, float g) {
    float g2 = g * g;
    float denom = 1.0 + g2 - 2.0 * g * cosTheta;
    return 1.5 * (1.0 - g2) / (2.0 + g2) * (1.0 + cosTheta * cosTheta) / pow(denom, 1.5);
  }
  
  void main() {
    vec3 viewDir = normalize(vPosition);
    
    // Angle from view direction to sun
    float cosTheta = dot(viewDir, sunDirection);
    
    // View altitude (angle above horizon)
    float viewAlt = viewDir.y;
    
    // Optical depth approximation based on view angle
    float zenithAngle = acos(max(0.0, viewDir.y));
    float opticalDepth = 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - degrees(zenithAngle), -1.253));
    opticalDepth = min(opticalDepth, 40.0);
    
    // Rayleigh scattering
    vec3 rayleighScatter = rayleighCoeff * rayleighPhase(cosTheta) * opticalDepth;
    
    // Mie scattering (forward scattering toward sun)
    float mieScatter = mieCoeff * miePhase(cosTheta, mieG) * opticalDepth * 0.5;
    
    // Sun intensity based on altitude
    float sunIntensity = smoothstep(-0.1, 0.3, sunAltitude);
    
    // Twilight colors
    float twilight = smoothstep(-0.2, 0.0, sunAltitude) * (1.0 - smoothstep(0.0, 0.15, sunAltitude));
    
    // Night factor
    float night = 1.0 - smoothstep(-0.3, 0.0, sunAltitude);
    
    // Sky color calculation
    vec3 skyColor = vec3(0.0);
    
    // Daytime blue sky (Rayleigh dominant)
    vec3 dayColor = vec3(0.3, 0.5, 0.9) * sunIntensity;
    dayColor *= exp(-rayleighScatter * 2.0);
    
    // Sunset/sunrise colors
    vec3 sunsetColor = vec3(1.0, 0.4, 0.1);
    float sunProximity = pow(max(0.0, cosTheta), 4.0);
    
    // Horizon glow during twilight
    float horizonGlow = pow(1.0 - abs(viewAlt), 8.0);
    vec3 twilightColor = mix(
      vec3(0.1, 0.15, 0.3),  // Zenith twilight (deep blue)
      vec3(0.8, 0.3, 0.1),   // Horizon twilight (orange)
      horizonGlow
    ) * twilight;
    
    // Night sky color
    vec3 nightColor = vec3(0.01, 0.015, 0.03) * (1.0 - horizonGlow * 0.5);
    
    // Combine all contributions
    skyColor = dayColor * (1.0 - twilight) * (1.0 - night);
    skyColor += twilightColor;
    skyColor += nightColor * night;
    
    // Add sun glow
    float sunGlow = pow(max(0.0, cosTheta), 256.0) * sunIntensity;
    skyColor += vec3(1.0, 0.95, 0.8) * sunGlow * 2.0;
    
    // Horizon haze
    float haze = pow(1.0 - abs(viewAlt), 12.0) * 0.15;
    skyColor += vec3(0.6, 0.7, 0.8) * haze * sunIntensity;
    
    // Mie scattering glow around sun
    skyColor += sunsetColor * mieScatter * sunProximity * sunIntensity;
    
    // Alpha based on sky brightness and position
    float alpha = 0.0;
    
    // Above horizon
    if (viewAlt > 0.0) {
      alpha = smoothstep(0.0, 0.3, viewAlt) * sunIntensity * 0.8;
      alpha += twilight * 0.6;
      alpha += night * 0.1;
      alpha = max(alpha, horizonGlow * 0.4);
    } else {
      // Below horizon - fade to ground
      alpha = smoothstep(-0.3, 0.0, viewAlt) * 0.3;
    }
    
    // Ensure minimum visibility at horizon
    alpha = max(alpha, horizonGlow * 0.2);
    
    gl_FragColor = vec4(skyColor, alpha);
  }
`;

export default function Atmosphere() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const observer = useAppStore((s) => s.observer);
  const simulationTime = useAppStore((s) => s.simulationTime);

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.SphereGeometry(560, 64, 32);
    const mat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.NormalBlending,
      uniforms: {
        sunDirection: { value: new THREE.Vector3(0, -1, 0) },
        sunAltitude: { value: -0.5 },
      },
    });
    return { geometry: geo, material: mat };
  }, []);

  // Pre-compute sun position from the current simulation time.
  const sunData = useMemo(() => {
    const hours = simulationTime.getHours() + simulationTime.getMinutes() / 60;
    const dayFraction = hours / 24;
    const sunAngle = (dayFraction - 0.5) * Math.PI * 2;
    const latRad = (observer.latitude * Math.PI) / 180;
    const sunAlt = Math.sin(sunAngle) * Math.cos(latRad);
    const sunAz = Math.cos(sunAngle);
    
    return {
      direction: new THREE.Vector3(
        Math.sin(sunAz) * Math.cos(sunAlt),
        sunAlt,
        Math.cos(sunAz) * Math.cos(sunAlt)
      ).normalize(),
      altitude: sunAlt,
    };
  }, [observer.latitude, simulationTime]);

  // Update uniforms only when sun data changes
  useFrame(() => {
    if (!matRef.current) return;
    matRef.current.uniforms.sunDirection.value.copy(sunData.direction);
    matRef.current.uniforms.sunAltitude.value = sunData.altitude;
  });

  return <mesh geometry={geometry} raycast={() => {}}>
    <primitive object={material} ref={matRef} attach="material" />
  </mesh>;
}
