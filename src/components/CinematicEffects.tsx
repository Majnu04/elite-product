'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  ChromaticAberration,
  DepthOfField,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { store } from '@/lib/store';
import { smoothstep, windowOpacity, lerp, clamp } from '@/lib/utils';

export default function CinematicEffects() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bloomRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vignetteRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chromaticRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dofRef = useRef<any>(null);

  useFrame(() => {
    const p = store.progress;
    const flipMix = windowOpacity(p, 0.735, 0.86, 0.45);
    const mistOp = windowOpacity(p, 0.39, 0.51, 0.35);
    const liquidFocus = windowOpacity(p, 0.80, 0.90, 0.3);
    const capScene = windowOpacity(p, 0.28, 0.42, 0.35);
    const reveal = smoothstep(0.0, 0.3, p);

    // Bloom
    if (bloomRef.current) {
      bloomRef.current.intensity = lerp(0.3, 0.8, reveal) + mistOp * 0.25 + liquidFocus * 0.3;
    }

    // Vignette
    if (vignetteRef.current) {
      vignetteRef.current.darkness = lerp(0.35, 0.65, flipMix) + liquidFocus * 0.1;
    }

    // Chromatic aberration
    if (chromaticRef.current) {
      const offset = 0.0006 + flipMix * 0.002 + liquidFocus * 0.001;
      chromaticRef.current.offset.set(offset, offset);
    }

    // Depth of Field — stronger during cap macro and liquid macro
    if (dofRef.current) {
      const dofBokeh = capScene * 2.5 + liquidFocus * 3.5;
      dofRef.current.bokehScale = clamp(dofBokeh, 0, 4);
      dofRef.current.focusDistance = capScene > 0.01
        ? 0.022
        : liquidFocus > 0.01
          ? 0.018
          : 0.04;
    }
  });

  const bloomProps = useMemo(() => ({
    luminanceThreshold: 0.7,
    luminanceSmoothing: 0.4,
    intensity: 0.3,
    mipmapBlur: true,
  }), []);

  return (
    <EffectComposer multisampling={store.isMobile ? 0 : 4}>
      <DepthOfField
        ref={dofRef}
        focusDistance={0.04}
        focalLength={0.05}
        bokehScale={0}
        height={480}
      />
      <Bloom ref={bloomRef} {...bloomProps} />
      <Vignette
        ref={vignetteRef}
        offset={0.3}
        darkness={0.4}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        premultiply
        blendFunction={BlendFunction.ADD}
        opacity={0.025}
      />
      <ChromaticAberration
        ref={chromaticRef}
        offset={new THREE.Vector2(0.0006, 0.0006)}
      />
    </EffectComposer>
  );
}
