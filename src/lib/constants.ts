export interface CameraKeyframe {
  p: number;
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

export const cameraKeyframes: CameraKeyframe[] = [
  { p: 0.00, position: [0.0, 0.30, 6.00], lookAt: [0, 0.05, 0], fov: 32 },
  { p: 0.06, position: [0.4, 0.22, 4.20], lookAt: [0, 0.05, 0], fov: 30 },
  { p: 0.14, position: [1.6, 0.35, 3.00], lookAt: [0, 0.12, 0], fov: 27 },
  { p: 0.22, position: [-1.5, 0.28, 2.80], lookAt: [0, 0.12, 0], fov: 27 },
  { p: 0.30, position: [0.12, 0.88, 1.40], lookAt: [0, 1.08, 0], fov: 22 },
  { p: 0.36, position: [0.08, 0.98, 1.15], lookAt: [0, 1.15, 0], fov: 18 },
  { p: 0.42, position: [0.0, 0.65, 1.20], lookAt: [0, 0.80, 0], fov: 24 },
  { p: 0.48, position: [0.0, 0.50, 1.50], lookAt: [0, 0.50, 0], fov: 32 },
  { p: 0.52, position: [0.4, 0.35, 2.80], lookAt: [0, 0.25, 0], fov: 36 },
  { p: 0.57, position: [1.4, 0.25, 2.20], lookAt: [0, 0.15, 0], fov: 28 },
  { p: 0.62, position: [-0.2, 0.50, 2.80], lookAt: [0, 0.35, 0], fov: 30 },
  { p: 0.68, position: [0.0, 0.35, 3.80], lookAt: [0, 0.35, 0], fov: 30 },
  { p: 0.73, position: [1.6, 0.42, 2.80], lookAt: [0, 0.40, 0], fov: 28 },
  { p: 0.78, position: [-1.9, 0.12, 1.90], lookAt: [0, 0.10, 0], fov: 26 },
  { p: 0.84, position: [0.08, -0.70, 0.55], lookAt: [0, -0.65, 0], fov: 14 },
  { p: 0.90, position: [0.0, 0.22, 3.20], lookAt: [0, 0.18, 0], fov: 30 },
  { p: 0.96, position: [0.0, 0.28, 4.80], lookAt: [0, 0.10, 0], fov: 30 },
  { p: 1.00, position: [0.0, 0.30, 5.20], lookAt: [0, 0.10, 0], fov: 31 },
];

export interface TextBlock {
  id: string;
  start: number;
  end: number;
}

export const sceneTextBlocks: TextBlock[] = [
  { id: 'hero-block', start: 0.00, end: 0.07 },
  { id: 's-reveal', start: 0.12, end: 0.29 },
  { id: 's-cap', start: 0.27, end: 0.39 },
  { id: 's-mist1', start: 0.38, end: 0.46 },
  { id: 's-mist2', start: 0.435, end: 0.52 },
  { id: 's-note-top', start: 0.49, end: 0.56 },
  { id: 's-note-heart', start: 0.53, end: 0.60 },
  { id: 's-note-base', start: 0.57, end: 0.65 },
  { id: 's-exploded', start: 0.62, end: 0.73 },
  { id: 's-flip', start: 0.72, end: 0.83 },
  { id: 's-liquid', start: 0.815, end: 0.91 },
  { id: 's-reconstruct', start: 0.89, end: 0.96 },
  { id: 'final-block', start: 0.95, end: 1.0 },
];
