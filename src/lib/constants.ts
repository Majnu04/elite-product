export interface CameraKeyframe {
  p: number;
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

export const cameraKeyframes: CameraKeyframe[] = [
  { p: 0.00, position: [0.0, 0.30, 6.00], lookAt: [0, 0.05, 0], fov: 32 },
  { p: 0.06, position: [0.4, 0.22, 4.20], lookAt: [0, 0.05, 0], fov: 30 },
  { p: 0.14, position: [0.6, 0.35, 3.20], lookAt: [1.0, 0.12, 0], fov: 28 },
  { p: 0.22, position: [-0.6, 0.30, 3.00], lookAt: [-1.0, 0.12, 0], fov: 28 },
  { p: 0.30, position: [0.12, 0.88, 1.40], lookAt: [0, 1.08, 0], fov: 22 },
  { p: 0.36, position: [0.08, 0.98, 1.15], lookAt: [0, 1.15, 0], fov: 18 },
  { p: 0.42, position: [0.0, 0.65, 1.20], lookAt: [0, 0.80, 0], fov: 24 },
  { p: 0.48, position: [0.0, 0.50, 1.50], lookAt: [0, 0.50, 0], fov: 32 },
  { p: 0.52, position: [0.4, 0.35, 2.80], lookAt: [1.0, 0.25, 0], fov: 36 },
  { p: 0.57, position: [0.8, 0.28, 2.40], lookAt: [-1.0, 0.15, 0], fov: 28 },
  { p: 0.62, position: [-0.2, 0.50, 2.80], lookAt: [0, 0.35, 0], fov: 30 },
  { p: 0.68, position: [0.0, 0.35, 3.80], lookAt: [0, 0.35, 0], fov: 30 },
  { p: 0.73, position: [1.2, 0.42, 2.80], lookAt: [0, 0.40, 0], fov: 28 },
  { p: 0.78, position: [-1.4, 0.15, 2.00], lookAt: [0, 0.10, 0], fov: 26 },
  { p: 0.84, position: [0.08, -0.70, 0.55], lookAt: [0, -0.65, 0], fov: 14 },
  { p: 0.90, position: [0.0, 0.22, 3.20], lookAt: [0, 0.18, 0], fov: 30 },
  { p: 0.96, position: [0.0, 0.28, 4.80], lookAt: [0, 0.10, 0], fov: 30 },
  { p: 1.00, position: [0.0, 0.30, 5.20], lookAt: [0, 0.10, 0], fov: 31 },
];

export interface TextBlock {
  id: string;
  start: number;
  end: number;
  side: 'center' | 'left' | 'right';
}

export const sceneTextBlocks: TextBlock[] = [
  { id: 'hero-block', start: 0.00, end: 0.07, side: 'center' },
  { id: 's-reveal', start: 0.12, end: 0.22, side: 'center' },
  { id: 's-drift-r', start: 0.16, end: 0.27, side: 'left' },
  { id: 's-drift-l', start: 0.24, end: 0.34, side: 'right' },
  { id: 's-cap', start: 0.30, end: 0.40, side: 'center' },
  { id: 's-mist1', start: 0.38, end: 0.46, side: 'center' },
  { id: 's-mist2', start: 0.44, end: 0.50, side: 'center' },
  { id: 's-note-top', start: 0.50, end: 0.56, side: 'left' },
  { id: 's-note-heart', start: 0.56, end: 0.62, side: 'right' },
  { id: 's-note-base', start: 0.62, end: 0.68, side: 'center' },
  { id: 's-exploded', start: 0.66, end: 0.76, side: 'center' },
  { id: 's-flip', start: 0.74, end: 0.82, side: 'center' },
  { id: 's-material', start: 0.82, end: 0.88, side: 'center' },
  { id: 's-liquid', start: 0.86, end: 0.92, side: 'center' },
  { id: 's-reconstruct', start: 0.90, end: 0.96, side: 'center' },
  { id: 'final-block', start: 0.95, end: 1.0, side: 'center' },
];

export interface BottleKeyframe {
  p: number;
  x: number;
  y: number;
}

export const bottleKeyframes: BottleKeyframe[] = [
  { p: 0.00, x: 0, y: 0 },
  { p: 0.12, x: 0, y: 0 },
  { p: 0.18, x: 2.0, y: 0 },
  { p: 0.26, x: 2.0, y: 0 },
  { p: 0.32, x: -2.0, y: 0 },
  { p: 0.40, x: 0, y: 0.5 },
  { p: 0.46, x: 0.4, y: 0.3 },
  { p: 0.52, x: 1.6, y: 0.2 },
  { p: 0.58, x: -1.6, y: -0.15 },
  { p: 0.64, x: 0, y: 0 },
  { p: 0.76, x: 0, y: 0 },
  { p: 0.82, x: 0, y: 0 },
  { p: 0.88, x: 0, y: 0 },
  { p: 0.94, x: 0, y: 0 },
  { p: 1.00, x: 0, y: 0 },
];

export interface MaterialPreset {
  name: string;
  glassColor: number;
  glassAttenuation: number;
  liquidColor: number;
  liquidEmissive: number;
  liquidEmissiveIntensity: number;
  capColor: number;
  capRoughness: number;
  rimColor: number;
}

export const materialPresets: MaterialPreset[] = [
  {
    name: 'OBSIDIAN',
    glassColor: 0xe8e2d8,
    glassAttenuation: 0xfff8ee,
    liquidColor: 0xc9a063,
    liquidEmissive: 0x3a2408,
    liquidEmissiveIntensity: 0.15,
    capColor: 0xc8c2b8,
    capRoughness: 0.15,
    rimColor: 0xf3ede2,
  },
  {
    name: 'MIDNIGHT',
    glassColor: 0xd0d8e8,
    glassAttenuation: 0xd8e4ff,
    liquidColor: 0x4a6a8a,
    liquidEmissive: 0x0a1830,
    liquidEmissiveIntensity: 0.2,
    capColor: 0x6a7080,
    capRoughness: 0.2,
    rimColor: 0x8fb4ff,
  },
  {
    name: 'CHAMPAGNE',
    glassColor: 0xf0e8d8,
    glassAttenuation: 0xfff4e0,
    liquidColor: 0xdab878,
    liquidEmissive: 0x4a3210,
    liquidEmissiveIntensity: 0.18,
    capColor: 0xd4b880,
    capRoughness: 0.12,
    rimColor: 0xf5e0b0,
  },
];

export function getMaterialBlend(p: number): { a: number; b: number; t: number } {
  if (p < 0.82) return { a: 0, b: 0, t: 0 };
  const blendStart = 0.82;
  const blendEnd = 0.92;
  const range = blendEnd - blendStart;
  const raw = (p - blendStart) / range;
  if (raw <= 0) return { a: 0, b: 0, t: 0 };
  if (raw >= 1) return { a: 1, b: 1, t: 0 };
  const scaled = raw * 2;
  const a = Math.min(1, Math.floor(scaled));
  const b = Math.min(2, a + 1);
  const t = scaled - a;
  return { a, b, t };
}
