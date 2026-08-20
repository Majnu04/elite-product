'use client';

import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { store } from '@/lib/store';
import {
  clamp,
  lerp,
  smoothstep,
  windowOpacity,
  interpolateCamera,
  interpolateBottle,
} from '@/lib/utils';
import { cameraKeyframes } from '@/lib/constants';
import EliteBottle from './EliteBottle';
import StudioLighting from './StudioLighting';
import CinematicEffects from './CinematicEffects';

function makeParticleTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function makeMistTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.8)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.3)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface ParticleData {
  geo: THREE.BufferGeometry;
  basePositions: Float32Array;
  seeds: Float32Array;
}

function createAmbientParticles(): ParticleData {
  const count = store.isMobile ? 300 : 750;
  const rand = seededRandom(42);
  const bp = new Float32Array(count * 3);
  const sd = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 0.4 + rand() * 2.4;
    const theta = rand() * Math.PI * 2;
    const yy = (rand() - 0.3) * 2.6;
    bp[i * 3] = Math.cos(theta) * r;
    bp[i * 3 + 1] = yy;
    bp[i * 3 + 2] = Math.sin(theta) * r;
    sd[i] = rand() * 10;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(bp.slice(), 3));
  return { geo, basePositions: bp, seeds: sd };
}

function createMistParticles(): ParticleData {
  const count = store.isMobile ? 80 : 200;
  const rand = seededRandom(137);
  const bp = new Float32Array(count * 3);
  const sd = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const spread = rand() * 0.15;
    bp[i * 3] = Math.cos(angle) * spread;
    bp[i * 3 + 1] = rand() * 1.5;
    bp[i * 3 + 2] = Math.sin(angle) * spread;
    sd[i] = rand() * 10;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(bp.slice(), 3));
  return { geo, basePositions: bp, seeds: sd };
}

export default function Scene() {
  const { camera } = useThree();
  const bottleRef = useRef<THREE.Group>(null);
  const bottleGroupRef = useRef<THREE.Group>(null);
  const particleRef = useRef<THREE.Points>(null);
  const particleMatRef = useRef<THREE.PointsMaterial>(null);
  const mistRef = useRef<THREE.Points>(null);
  const mistMatRef = useRef<THREE.PointsMaterial>(null);
  const ambientGlowRef = useRef<THREE.Sprite>(null);
  const ambientGlowMatRef = useRef<THREE.SpriteMaterial>(null);

  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpLook = useMemo(() => new THREE.Vector3(), []);
  const _colA = useMemo(() => new THREE.Color(), []);
  const _colB = useMemo(() => new THREE.Color(), []);
  const _noteColor = useMemo(() => new THREE.Color(), []);
  const _bottleOffset = useMemo(() => ({ x: 0, y: 0 }), []);

  const [ambientData] = useState(createAmbientParticles);
  const [mistData] = useState(createMistParticles);

  const particleTexture = useMemo(() => makeParticleTexture(), []);
  const mistTexture = useMemo(() => makeMistTexture(), []);

  const glowTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,240,210,0.9)');
    g.addColorStop(0.35, 'rgba(230,190,130,0.35)');
    g.addColorStop(1, 'rgba(230,190,130,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const cam = camera as THREE.PerspectiveCamera;

    if (!store.isReducedMotion) {
      const progressDamp = 1 - Math.exp(-delta / 0.15);
      store.progress += (store.targetProgress - store.progress) * progressDamp;
    }
    const p = store.progress;

    // Bottle drift — interpolate bottle position
    interpolateBottle(p, _bottleOffset);
    if (!store.isReducedMotion) {
      const driftDamp = 1 - Math.exp(-delta / 0.18);
      store.smoothBottleX += (_bottleOffset.x - store.smoothBottleX) * driftDamp;
      store.smoothBottleY += (_bottleOffset.y - store.smoothBottleY) * driftDamp;
    } else {
      store.smoothBottleX = _bottleOffset.x;
      store.smoothBottleY = _bottleOffset.y;
    }

    // Apply bottle position to group
    if (bottleGroupRef.current) {
      bottleGroupRef.current.position.x = store.smoothBottleX;
      bottleGroupRef.current.position.y = -0.25 + store.smoothBottleY;
    }

    // Camera — Catmull-Rom path + exponential damping
    const targetFov = interpolateCamera(p, cameraKeyframes, tmpPos, tmpLook);

    // Add partial bottle tracking to camera lookAt
    tmpLook.x += store.smoothBottleX * 0.4;
    tmpLook.y += store.smoothBottleY * 0.3;

    if (!store.isReducedMotion) {
      const camDamp = 1 - Math.exp(-delta / 0.12);
      const lookDamp = 1 - Math.exp(-delta / 0.14);
      const fovDamp = 1 - Math.exp(-delta / 0.13);

      store.smoothCamPos.lerp(tmpPos, camDamp);
      store.smoothCamLook.lerp(tmpLook, lookDamp);
      store.smoothCamFov += (targetFov - store.smoothCamFov) * fovDamp;
    } else {
      store.smoothCamPos.copy(tmpPos);
      store.smoothCamLook.copy(tmpLook);
      store.smoothCamFov = targetFov;
    }

    cam.position.copy(store.smoothCamPos);
    cam.fov = store.smoothCamFov;

    if (!store.isReducedMotion) {
      cam.position.x += Math.sin(t * 0.35) * 0.005;
      cam.position.y += Math.sin(t * 0.27 + 1.3) * 0.004;
      cam.fov += Math.sin(t * 0.18) * 0.12;
    }

    if (!store.isMobile && !store.isReducedMotion) {
      cam.position.x += store.mouseX * 0.10;
      cam.position.y += -store.mouseY * 0.05;
    }

    cam.updateProjectionMatrix();
    cam.lookAt(store.smoothCamLook);

    // Ambient Particles
    if (particleRef.current && particleMatRef.current) {
      const mistOp = windowOpacity(p, 0.39, 0.51, 0.35);
      const notesOp = windowOpacity(p, 0.49, 0.63, 0.2);
      const dissolveOp = dissolveAmount(p);
      const totalOp = clamp(mistOp * 0.8 + notesOp * 0.5 + dissolveOp * 0.9, 0, 0.95);
      particleMatRef.current.opacity = totalOp;

      if (notesOp > 0.01) {
        const noteT = clamp((p - 0.50) / 0.125, 0, 1);
        _colA.setHex(0xdfe8f2);
        _colB.setHex(0xc9a063);
        _noteColor.lerpColors(_colA, _colB, noteT);
        particleMatRef.current.color.copy(_noteColor);
      } else if (dissolveOp > 0.01) {
        particleMatRef.current.color.setHex(0xf0e2c4);
      } else {
        particleMatRef.current.color.setHex(0xd8bf8f);
      }

      const posAttr = ambientData.geo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const drift = store.isReducedMotion ? 0 : 1;
      const bp = ambientData.basePositions;
      const sd = ambientData.seeds;

      for (let i = 0, len = arr.length / 3; i < len; i++) {
        const bx = bp[i * 3];
        const by = bp[i * 3 + 1];
        const bz = bp[i * 3 + 2];
        const s = sd[i];
        const swirl = Math.sin(t * 0.3 + s) * 0.15 * drift;
        const rise = ((t * 0.05 + s * 0.1) % 1.0) * 0.6 * drift;
        arr[i * 3] = lerp(bx + swirl, bx * 0.3, dissolveOp * 0.4);
        arr[i * 3 + 1] = by + rise - 0.3 * drift + (mistOp > 0.05 ? Math.sin(t * 0.6 + s) * 0.1 : 0);
        arr[i * 3 + 2] = lerp(bz + Math.cos(t * 0.25 + s) * 0.15 * drift, bz * 0.3, dissolveOp * 0.4);
      }
      posAttr.needsUpdate = true;
    }

    // Fragrance Mist — follows bottle drift
    if (mistRef.current && mistMatRef.current) {
      const capLift = smoothstep(0.28, 0.38, p);
      const mistFade = windowOpacity(p, 0.39, 0.52, 0.4);
      mistMatRef.current.opacity = capLift * mistFade * 0.6;
      mistRef.current.position.x = store.smoothBottleX;
      mistRef.current.position.z = 0;

      const posAttr = mistData.geo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const drift = store.isReducedMotion ? 0 : 1;
      const sd = mistData.seeds;

      for (let i = 0, len = arr.length / 3; i < len; i++) {
        const s = sd[i];
        const angle = s * 2.0 + t * 0.15 * drift;
        const rise = ((t * 0.08 + s * 0.12) % 1.0) * 1.8 * drift;
        const spread = 0.05 + rise * 0.18;
        arr[i * 3] = Math.cos(angle) * spread + Math.sin(t * 0.4 + s) * 0.04 * drift;
        arr[i * 3 + 1] = 1.35 + rise * 0.8;
        arr[i * 3 + 2] = Math.sin(angle) * spread + Math.cos(t * 0.35 + s) * 0.04 * drift;
      }
      posAttr.needsUpdate = true;
    }

    // Ambient glow — follows bottle
    if (ambientGlowMatRef.current && ambientGlowRef.current) {
      const flipMix = windowOpacity(p, 0.735, 0.86, 0.45);
      const dissolve = dissolveAmount(p);
      ambientGlowMatRef.current.opacity =
        lerp(0.0, 0.2, smoothstep(0.0, 0.2, p)) * (1 - dissolve) + flipMix * 0.18;
      ambientGlowRef.current.position.x = 0.6 + store.smoothBottleX * 0.5 - flipMix * 1.2;
      ambientGlowRef.current.position.y = 0.9 + store.smoothBottleY * 0.3;
    }
  });

  return (
    <>
      <Environment resolution={256} background={false}>
        <mesh scale={[100, 100, 100]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#080706" side={THREE.BackSide} />
        </mesh>
        <pointLight intensity={100} position={[3, 4, 3]} color="#f2e3c6" distance={25} />
        <pointLight intensity={60} position={[-3, 2, -3]} color="#8fb4ff" distance={25} />
        <pointLight intensity={80} position={[0, 5, 0]} color="#f3ede2" distance={18} />
        <pointLight intensity={45} position={[-2.0, 0.8, 2.0]} color="#f3ede2" distance={15} />
        <pointLight intensity={35} position={[2.0, 0.6, 2.0]} color="#f3ede2" distance={15} />
        <pointLight intensity={25} position={[0, 2.5, -3]} color="#e8dcc8" distance={12} />
        <pointLight intensity={20} position={[-3.5, 1.0, 0]} color="#d4c8b4" distance={12} />
      </Environment>

      <StudioLighting />

      <group ref={bottleGroupRef} position={[0, -0.25, 0]}>
        <EliteBottle ref={bottleRef} />
      </group>

      <points ref={particleRef} geometry={ambientData.geo}>
        <pointsMaterial
          ref={particleMatRef}
          color={0xd8bf8f}
          size={store.isMobile ? 0.055 : 0.042}
          map={particleTexture}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <points ref={mistRef} geometry={mistData.geo}>
        <pointsMaterial
          ref={mistMatRef}
          color={0xf3ede2}
          size={store.isMobile ? 0.12 : 0.09}
          map={mistTexture}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <sprite ref={ambientGlowRef} position={[0.6, 0.9, -1.4]}>
        <spriteMaterial
          ref={ambientGlowMatRef}
          map={glowTexture}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      <CinematicEffects />
    </>
  );
}

function dissolveAmount(p: number): number {
  const start = 0.905, mid = 0.928, end = 0.955;
  if (p < start || p > end) return 0;
  if (p < mid) return smoothstep(start, mid, p);
  return 1 - smoothstep(mid, end, p);
}
