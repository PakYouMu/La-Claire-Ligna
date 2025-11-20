"use client";

import React, { useRef, useMemo, useEffect, useContext } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MousePositionContext } from '../context/mouse-position-context';
import { WAVE_CONFIG, REDUCED_MOTION_CONFIG } from '@/wave.config';
// @ts-ignore - no types available for threejs-meshline
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'threejs-meshline';

// Extend R3F with MeshLine components
extend({ MeshLine, MeshLineMaterial });

// Add TypeScript declarations
declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLine: any;
    meshLineMaterial: any;
  }
}

// --- Wave Component ---
const Wave = ({ reducedMotion = false }: { reducedMotion?: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<any>(null!);
  const lineRef = useRef<any>(null!);
  
  const waveSourcesRef = useRef<Array<{pos: THREE.Vector2, strength: number, creationTime: number, initialIntensity: number}>>([]);
  const lastMousePositionRef = useRef(new THREE.Vector2(0, 0));
  const lastMouseTimeRef = useRef(0);
  const mouseVelocityRef = useRef(0);
  const { x: mouseX, y: mouseY } = useContext(MousePositionContext);
  const config = reducedMotion ? REDUCED_MOTION_CONFIG : WAVE_CONFIG;

  const baseColorRef = useRef(new THREE.Color('white'));
  const sheenColorRef = useRef(new THREE.Color('white'));

  const initialVertices = useMemo(() => {
    const vertices = [];
    const segments = 500;
    const width = 10;
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width - width / 2;
      vertices.push(new THREE.Vector3(x, 0, 0));
    }
    return vertices;
  }, []);

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas && materialRef.current) {
      const style = getComputedStyle(canvas);
      const foregroundValue = style.getPropertyValue('--foreground').trim();
      if (foregroundValue) {
        const parts = foregroundValue.split(' ');
        const h = parseFloat(parts[0]);
        const s = parseFloat(parts[1]);
        const l = parseFloat(parts[2]);
        baseColorRef.current.setHSL(h / 360, s / 100, l / 100);
        sheenColorRef.current.setHSL(h / 360, s / 100, Math.min(l / 100 + 0.2, 1.0));
      }
    }
  }, []);

  useFrame((state) => {
    const { clock, size } = state;

    // Handle mouse interaction
    if (mouseX !== null && mouseY !== null) {
      const now = clock.getElapsedTime();
      const currentMousePos = new THREE.Vector2(mouseX, mouseY);
      
      // Calculate velocity
      const deltaTime = now - lastMouseTimeRef.current;
      if (deltaTime > 0) {
        const distance = lastMousePositionRef.current.distanceTo(currentMousePos);
        const instantaneousVelocity = distance / (deltaTime * 1000);
        mouseVelocityRef.current = (instantaneousVelocity * 0.2) + (mouseVelocityRef.current * 0.8);
      }
      
      // Add wave source on movement
      if (lastMousePositionRef.current.distanceTo(currentMousePos) > 5) {
        const worldX = (mouseX / size.width) * 10 - 5;
        waveSourcesRef.current.push({
          pos: new THREE.Vector2(worldX, 0),
          strength: 1.0,
          creationTime: now,
          initialIntensity: mouseVelocityRef.current
        });
        lastMousePositionRef.current.copy(currentMousePos);
        lastMouseTimeRef.current = now;
      }
    }

    // Decay velocity
    mouseVelocityRef.current *= config.velocityDecayFactor;

    // Update wave sources with decay
    const now = clock.getElapsedTime();
    waveSourcesRef.current = waveSourcesRef.current.map(source => {
      const intensityRatio = Math.min(source.initialIntensity / config.lingerVelocityThreshold, 1.0);
      const lingerDuration = (config.minLinger + (config.maxLinger - config.minLinger) * intensityRatio) / 1000;
      const age = now - source.creationTime;
      const progress = Math.min(age / lingerDuration, 1.0);
      const decayFactor = Math.pow(1.0 - progress, 2);
      return { ...source, strength: decayFactor };
    }).filter(s => s.strength > 0.001);

    // Keep only most recent sources
    if (waveSourcesRef.current.length > 10) {
      waveSourcesRef.current = waveSourcesRef.current.slice(-10);
    }

    // Update vertex positions with wave physics
    const updatedVertices = initialVertices.map((vertex, i) => {
      const pos = vertex.clone();
      
      // Global wave
      const globalWave = Math.sin(pos.x * 0.5 + clock.getElapsedTime() * 0.2) * 0.05;
      pos.y += globalWave;
      
      // Mouse-driven waves
      let totalMouseDisplacement = 0;
      for (const source of waveSourcesRef.current) {
        const distX = Math.abs(pos.x - source.pos.x);
        const horizontalInfluence = 2.0;
        
        if (distX < horizontalInfluence) {
          const normalizedDist = distX / horizontalInfluence;
          const t = 1.0 - normalizedDist;
          const horizontalFalloff = t * t * (3.0 - 2.0 * t);
          const wavePhase = (pos.x * 0.04) + (clock.getElapsedTime() * 1.69);
          const sineWave = Math.sin(wavePhase);
          const displacement = sineWave * 0.3 * horizontalFalloff * source.strength;
          totalMouseDisplacement += displacement;
        }
      }
      pos.y += totalMouseDisplacement;
      
      return pos;
    });

    // Update the MeshLine geometry
    if (lineRef.current) {
      lineRef.current.setVertices(updatedVertices.flatMap(v => [v.x, v.y, v.z]));
    }

    // Calculate color based on mouse distance (sheen effect)
    if (materialRef.current && mouseX !== null && mouseY !== null) {
      // Simple sheen based on overall mouse presence
      const centerDist = Math.sqrt(Math.pow(mouseX - size.width / 2, 2) + Math.pow(mouseY - size.height / 2, 2));
      const maxDist = Math.sqrt(Math.pow(size.width / 2, 2) + Math.pow(size.height / 2, 2));
      const sheenFactor = Math.pow(1.0 - Math.min(centerDist / maxDist, 1.0), 2);
      
      const finalColor = baseColorRef.current.clone().lerp(sheenColorRef.current, sheenFactor * 0.3);
      materialRef.current.color = finalColor;
    }
  });

  return (
    // @ts-ignore
    <mesh ref={meshRef} raycast={MeshLineRaycast}>
      {/* @ts-ignore */}
      <meshLine ref={lineRef} attach="geometry" vertices={initialVertices.flatMap(v => [v.x, v.y, v.z])} />
      {/* @ts-ignore */}
      <meshLineMaterial
        ref={materialRef}
        attach="material"
        transparent
        depthTest={false}
        lineWidth={config.lineWidth * 0.002}
        color={baseColorRef.current}
        resolution={new THREE.Vector2(
          typeof window !== 'undefined' ? window.innerWidth : 1920,
          typeof window !== 'undefined' ? window.innerHeight : 1080
        )}
        sizeAttenuation={0}
      />
    </mesh>
  );
};

// --- Main Component Wrapper ---
const InteractiveWaveBackground = ({
    children,
    reducedMotion = false
}: {
    children: React.ReactNode;
    reducedMotion?: boolean;
}) => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        className="z-0"
        gl={{ antialias: true }}
      >
        <Wave reducedMotion={reducedMotion} />
      </Canvas>
      <div className="absolute inset-0 z-10 grid place-items-center pointer-events-none">
        {children}
      </div>
    </div>
  );
};

export default InteractiveWaveBackground;