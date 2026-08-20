'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { store } from '@/lib/store';
import { smoothstep, windowOpacity, lerp } from '@/lib/utils';

export default function StudioLighting() {
  const keyRef = useRef<THREE.SpotLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.HemisphereLight>(null);
  const topRef = useRef<THREE.PointLight>(null);
  const stripLeftRef = useRef<THREE.SpotLight>(null);
  const stripRightRef = useRef<THREE.SpotLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const frontFillRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const p = store.progress;
    const reveal = smoothstep(0.0, 0.18, p);

    if (keyRef.current) {
      const driftBoost = Math.abs(store.smoothBottleX) * 0.3;
      keyRef.current.intensity = lerp(1.2, 5.0, reveal) + driftBoost;
      keyRef.current.position.x = 3.0 + store.smoothBottleX * 0.3;
    }
    if (rimRef.current) {
      rimRef.current.intensity = lerp(0.4, 1.8, smoothstep(0.0, 0.25, p));
    }
    if (fillRef.current) {
      fillRef.current.intensity = lerp(0.15, 0.4, reveal);
    }
    if (topRef.current) {
      const liquidFocus = windowOpacity(p, 0.80, 0.90, 0.3);
      const mistOp = windowOpacity(p, 0.39, 0.51, 0.35);
      topRef.current.intensity = liquidFocus * 3.0 + mistOp * 1.5;
    }
    if (stripLeftRef.current) {
      stripLeftRef.current.intensity = lerp(0.8, 3.0, reveal);
    }
    if (stripRightRef.current) {
      stripRightRef.current.intensity = lerp(0.6, 2.5, reveal);
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = lerp(0.03, 0.12, reveal);
    }
    if (frontFillRef.current) {
      frontFillRef.current.intensity = lerp(0.2, 0.8, reveal);
      frontFillRef.current.position.x = store.smoothBottleX * 0.2;
    }
  });

  return (
    <>
      <spotLight
        ref={keyRef}
        color={0xf2e3c6}
        intensity={1.2}
        distance={25}
        angle={Math.PI / 4.5}
        penumbra={0.6}
        decay={1.5}
        position={[3.0, 4.0, 4.0]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
        target-position={[0, 0.2, 0]}
      />

      <directionalLight
        ref={rimRef}
        color={0x8fb4ff}
        intensity={0.4}
        position={[-4.0, 3.0, -5.0]}
      />

      <hemisphereLight
        ref={fillRef}
        color={0x2a2620}
        groundColor={0x08070a}
        intensity={0.15}
      />

      <pointLight
        ref={topRef}
        color={0xc9a063}
        intensity={0}
        distance={8}
        decay={2}
        position={[0, 3.5, 0.5]}
      />

      <spotLight
        ref={stripLeftRef}
        color={0xf3ede2}
        intensity={0.8}
        distance={12}
        angle={Math.PI / 10}
        penumbra={0.9}
        decay={1.5}
        position={[-2.0, 0.8, 1.8]}
        target-position={[0, 0.2, 0]}
      />

      <spotLight
        ref={stripRightRef}
        color={0xf3ede2}
        intensity={0.6}
        distance={12}
        angle={Math.PI / 10}
        penumbra={0.9}
        decay={1.5}
        position={[2.0, 0.6, 1.8]}
        target-position={[0, 0.2, 0]}
      />

      <pointLight
        ref={frontFillRef}
        color={0xf5efe5}
        intensity={0.2}
        distance={8}
        decay={2}
        position={[0, 0.5, 3.5]}
      />

      <ambientLight ref={ambientRef} color={0xf3ede2} intensity={0.03} />
    </>
  );
}
