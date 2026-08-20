import * as THREE from 'three';

export const store = {
  progress: 0,
  targetProgress: 0,
  mouseX: 0,
  mouseY: 0,
  isMobile: false,
  isReducedMotion: false,
  isReady: false,
  smoothCamPos: new THREE.Vector3(0, 0.3, 6),
  smoothCamLook: new THREE.Vector3(0, 0.05, 0),
  smoothCamFov: 32,
};
