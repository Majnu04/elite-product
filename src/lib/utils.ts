import * as THREE from 'three';
import type { CameraKeyframe, BottleKeyframe, MaterialPreset } from './constants';
import { bottleKeyframes, materialPresets } from './constants';

const _v = new THREE.Vector3();

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function windowOpacity(p: number, start: number, end: number, fadeFrac = 0.28): number {
  const span = end - start;
  if (span <= 0) return p >= start && p <= end ? 1 : 0;
  const fade = span * fadeFrac;
  const inV = smoothstep(start, start + fade, p);
  const outV = 1.0 - smoothstep(end - fade, end, p);
  return clamp(Math.min(inV, outV), 0, 1);
}

export function riseOpacity(p: number, start: number, end: number): number {
  return smoothstep(start, end, p);
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

export function interpolateCamera(
  p: number,
  keyframes: CameraKeyframe[],
  outPos: THREE.Vector3,
  outLook: THREE.Vector3,
): number {
  let i = 0;
  while (i < keyframes.length - 2 && p > keyframes[i + 1].p) i++;

  const im = Math.max(0, i - 1);
  const ip = Math.min(i + 1, keyframes.length - 1);
  const ipp = Math.min(i + 2, keyframes.length - 1);

  const a = keyframes[i];
  const b = keyframes[ip];
  const range = b.p - a.p;
  const t = range > 0.0001 ? clamp((p - a.p) / range, 0, 1) : 0;

  outPos.set(
    catmullRom(keyframes[im].position[0], a.position[0], b.position[0], keyframes[ipp].position[0], t),
    catmullRom(keyframes[im].position[1], a.position[1], b.position[1], keyframes[ipp].position[1], t),
    catmullRom(keyframes[im].position[2], a.position[2], b.position[2], keyframes[ipp].position[2], t),
  );
  outLook.set(
    catmullRom(keyframes[im].lookAt[0], a.lookAt[0], b.lookAt[0], keyframes[ipp].lookAt[0], t),
    catmullRom(keyframes[im].lookAt[1], a.lookAt[1], b.lookAt[1], keyframes[ipp].lookAt[1], t),
    catmullRom(keyframes[im].lookAt[2], a.lookAt[2], b.lookAt[2], keyframes[ipp].lookAt[2], t),
  );

  return catmullRom(keyframes[im].fov, a.fov, b.fov, keyframes[ipp].fov, t);
}

export function interpolateBottle(p: number, out: { x: number; y: number }): void {
  const kf = bottleKeyframes;
  let i = 0;
  while (i < kf.length - 2 && p > kf[i + 1].p) i++;

  const a = kf[i];
  const b = kf[Math.min(i + 1, kf.length - 1)];
  const range = b.p - a.p;
  const t = range > 0.0001 ? clamp((p - a.p) / range, 0, 1) : 0;
  const et = smoothstep(0, 1, t);

  out.x = lerp(a.x, b.x, et);
  out.y = lerp(a.y, b.y, et);
}

export function interpolateMaterials(
  p: number,
  presets: MaterialPreset[],
  out: { a: number; b: number; t: number },
): void {
  if (p < 0.82) { out.a = 0; out.b = 0; out.t = 0; return; }
  const blendStart = 0.82;
  const blendEnd = 0.92;
  const raw = clamp((p - blendStart) / (blendEnd - blendStart), 0, 1);
  const scaled = raw * (presets.length - 1);
  const a = Math.min(presets.length - 1, Math.floor(scaled));
  const b = Math.min(presets.length - 1, a + 1);
  out.a = a;
  out.b = b;
  out.t = scaled - Math.floor(scaled);
}

export function lerpColor(a: THREE.Color, b: THREE.Color, t: number, out: THREE.Color): void {
  out.r = lerp(a.r, b.r, t);
  out.g = lerp(a.g, b.g, t);
  out.b = lerp(a.b, b.b, t);
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 820 || window.matchMedia('(hover:none), (pointer:coarse)').matches;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const clampV3 = (v: THREE.Vector3, min: THREE.Vector3, max: THREE.Vector3): THREE.Vector3 => {
  return _v.set(
    clamp(v.x, min.x, max.x),
    clamp(v.y, min.y, max.y),
    clamp(v.z, min.z, max.z),
  );
};
