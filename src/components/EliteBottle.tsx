'use client';

import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { store } from '@/lib/store';
import { smoothstep, clamp, windowOpacity, riseOpacity, lerp } from '@/lib/utils';

const rimVert = `
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const rimFrag = `
  uniform vec3 glowColor;
  uniform float intensity;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    float fresnel = pow(1.0 - clamp(dot(normalize(vNormalW), normalize(vViewDir)), 0.0, 1.0), 3.5);
    gl_FragColor = vec4(glowColor * fresnel * intensity, fresnel * intensity);
  }
`;

const bgVert = `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const bgFrag = `
  varying vec3 vPos;
  uniform vec3 topColor;
  uniform vec3 botColor;
  void main() {
    float h = normalize(vPos).y * 0.5 + 0.5;
    gl_FragColor = vec4(mix(botColor, topColor, h), 1.0);
  }
`;

function createRoundedBoxGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  bevel: number,
  segments = 6,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw, hh);

  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: segments,
    curveSegments: segments * 2,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

function makeLogoTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, c.width, c.height);

  ctx.fillStyle = 'rgba(230, 224, 210, 0.9)';
  ctx.font = '600 58px "Playfair Display", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '16px';
  ctx.fillText('ELITE', c.width / 2, c.height / 2 - 30);

  ctx.fillStyle = 'rgba(200, 195, 185, 0.5)';
  ctx.font = '300 14px "Inter", sans-serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('EAU DE PARFUM', c.width / 2, c.height / 2 + 16);

  ctx.fillStyle = 'rgba(200, 195, 185, 0.3)';
  ctx.font = '300 11px "Inter", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('50 ML', c.width / 2, c.height / 2 + 38);

  return new THREE.CanvasTexture(c);
}

const EliteBottle = forwardRef(function EliteBottle(_props, ref) {
  const groupRef = useRef<THREE.Group>(null);
  const capGroup = useRef<THREE.Group>(null);
  const nozzleGroup = useRef<THREE.Group>(null);
  const liquidMesh = useRef<THREE.Mesh>(null);
  const logoMesh = useRef<THREE.Mesh>(null);
  const bodyMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const neckMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const rimMatRef = useRef<THREE.ShaderMaterial>(null);
  const capMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const liquidMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const nozzleMatsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const bgMatRef = useRef<THREE.ShaderMaterial>(null);

  const _bgTopA = useMemo(() => new THREE.Color(0x1a1712), []);
  const _bgTopB = useMemo(() => new THREE.Color(0x4a2f14), []);
  const _bgBotA = useMemo(() => new THREE.Color(0x050504), []);
  const _bgBotB = useMemo(() => new THREE.Color(0x140d06), []);

  useImperativeHandle(ref, () => groupRef.current!);

  const { bodyGeo, liquidGeo, capGeo } = useMemo(() => {
    const body = createRoundedBoxGeometry(1.5, 2.4, 0.88, 0.1, 0.055, 5);
    const liquid = createRoundedBoxGeometry(1.36, 1.45, 0.74, 0.08, 0.035, 4);
    const cap = createRoundedBoxGeometry(1.05, 0.52, 0.7, 0.06, 0.03, 4);
    return { bodyGeo: body, liquidGeo: liquid, capGeo: cap };
  }, []);

  const logoTexture = useMemo(() => makeLogoTexture(), []);

  const glassMaterial = useMemo(() => ({
    color: 0xf0ebe3,
    transmission: 0.94,
    roughness: 0.03,
    metalness: 0,
    ior: 1.52,
    thickness: 3.0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 2.0,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
    attenuationColor: new THREE.Color(0xfff8ee),
    attenuationDistance: 5,
    specularIntensity: 1.0,
    specularColor: new THREE.Color(0xffffff),
  }), []);

  const liquidMaterial = useMemo(() => ({
    color: 0xc9a063,
    transmission: 0.6,
    roughness: 0.08,
    metalness: 0,
    ior: 1.36,
    thickness: 2.0,
    attenuationColor: new THREE.Color(0x8a4500),
    attenuationDistance: 2.5,
    envMapIntensity: 1.0,
    emissive: new THREE.Color(0x3a2408),
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.88,
    specularIntensity: 0.8,
    specularColor: new THREE.Color(0xfff0d0),
  }), []);

  const metalMaterial = useMemo(() => ({
    color: 0xc8c2b8,
    metalness: 1.0,
    roughness: 0.15,
    envMapIntensity: 2.0,
  }), []);

  useFrame((_state, delta) => {
    const p = store.progress;
    const t = performance.now() * 0.001;

    if (groupRef.current) {
      const targetRotY = p * 1.2
        + smoothstep(0.14, 0.30, p) * Math.PI * 2
        + smoothstep(0.735, 0.815, p) * Math.PI;
      const targetRotZ = store.isReducedMotion ? 0 : Math.sin(t * 0.2) * 0.008;

      if (!store.isReducedMotion) {
        const rotDamp = 1 - Math.exp(-delta / 0.2);
        groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * rotDamp;
        groupRef.current.rotation.z += (targetRotZ - groupRef.current.rotation.z) * rotDamp;
      } else {
        groupRef.current.rotation.y = targetRotY;
        groupRef.current.rotation.z = targetRotZ;
      }
    }

    if (capGroup.current) {
      const capLiftBase = riseOpacity(p, 0.28, 0.38);
      const explode = explodeAmount(p);
      capGroup.current.position.y = 1.60 + capLiftBase * 0.42 + explode * 0.9;
      capGroup.current.rotation.y = capLiftBase * 0.5 + explode * 1.2;
    }

    const capLift = riseOpacity(p, 0.28, 0.38);
    const explode = explodeAmount(p);
    const nozzleOp = clamp(capLift * 1.5, 0, 1) * (1 - explode * 0.4);
    nozzleMatsRef.current.forEach((m) => {
      if (m) {
        m.opacity = nozzleOp;
        m.transparent = nozzleOp < 1;
      }
    });
    if (nozzleGroup.current) {
      nozzleGroup.current.position.y = 1.35 + explode * 0.4;
    }

    if (liquidMesh.current) liquidMesh.current.position.y = -0.48 - explode * 0.12;
    if (logoMesh.current) logoMesh.current.position.y = 0.05 - explode * 0.05;

    if (liquidMatRef.current) {
      const lf = windowOpacity(p, 0.80, 0.90, 0.3);
      liquidMatRef.current.emissiveIntensity = 0.15 + lf * 0.6;
    }

    const dissolve = dissolveAmount(p);
    if (bodyMatRef.current) bodyMatRef.current.opacity = 0.95 * (1 - dissolve * 0.85);
    if (neckMatRef.current) neckMatRef.current.opacity = 0.92 * (1 - dissolve * 0.85);
    if (liquidMatRef.current) liquidMatRef.current.opacity = 0.88 * (1 - dissolve * 0.85);
    if (capMatRef.current) {
      capMatRef.current.opacity = 1 - dissolve * 0.85;
      capMatRef.current.transparent = dissolve > 0.01;
    }

    if (rimMatRef.current) {
      const flipMix = windowOpacity(p, 0.735, 0.86, 0.45);
      rimMatRef.current.uniforms.intensity.value =
        lerp(0.15, 0.55, smoothstep(0.0, 0.2, p)) + flipMix * 0.5;
      rimMatRef.current.uniforms.glowColor.value.setHex(flipMix > 0.05 ? 0xf0c88a : 0xf3ede2);
    }

    if (bgMatRef.current) {
      const flipMix = windowOpacity(p, 0.735, 0.86, 0.45);
      bgMatRef.current.uniforms.topColor.value.lerpColors(_bgTopA, _bgTopB, flipMix);
      bgMatRef.current.uniforms.botColor.value.lerpColors(_bgBotA, _bgBotB, flipMix);
    }
  });

  const setNozzleMat = (i: number) => (el: THREE.MeshStandardMaterial | null) => {
    if (el) nozzleMatsRef.current[i] = el;
  };

  return (
    <>
      <mesh scale={[40, 40, 40]}>
        <sphereGeometry args={[1, 32, 32]} />
        <shaderMaterial
          ref={bgMatRef}
          vertexShader={bgVert}
          fragmentShader={bgFrag}
          uniforms={{
            topColor: { value: new THREE.Color(0x1a1712) },
            botColor: { value: new THREE.Color(0x050504) },
          }}
          side={THREE.BackSide}
        />
      </mesh>

      <group ref={groupRef} position={[0, -0.25, 0]}>
        <mesh geometry={bodyGeo} castShadow receiveShadow>
          <meshPhysicalMaterial ref={bodyMatRef} {...glassMaterial} />
        </mesh>

        <mesh geometry={bodyGeo} scale={[1.01, 1.01, 1.01]}>
          <shaderMaterial
            ref={rimMatRef}
            vertexShader={rimVert}
            fragmentShader={rimFrag}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.FrontSide}
            uniforms={{
              glowColor: { value: new THREE.Color(0xf3ede2) },
              intensity: { value: 0.35 },
            }}
          />
        </mesh>

        <mesh position={[0, 1.425, 0]}>
          <cylinderGeometry args={[0.2, 0.26, 0.35, 32]} />
          <meshPhysicalMaterial ref={neckMatRef} {...glassMaterial} thickness={2.0} />
        </mesh>

        <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.26, 0.018, 12, 48]} />
          <meshStandardMaterial {...metalMaterial} />
        </mesh>

        <mesh position={[0, 1.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.18, 0.008, 8, 32]} />
          <meshStandardMaterial color={0xb8b2a8} metalness={1.0} roughness={0.25} envMapIntensity={1.5} />
        </mesh>

        <mesh ref={liquidMesh} geometry={liquidGeo} position={[0, -0.48, 0]}>
          <meshPhysicalMaterial ref={liquidMatRef} {...liquidMaterial} />
        </mesh>

        <group ref={capGroup} position={[0, 1.60, 0]}>
          <mesh geometry={capGeo} castShadow>
            <meshStandardMaterial ref={capMatRef} {...metalMaterial} />
          </mesh>
          <mesh position={[0, 0.265, 0]}>
            <cylinderGeometry args={[0.48, 0.52, 0.02, 48]} />
            <meshStandardMaterial color={0xd5cfc6} metalness={1.0} roughness={0.12} envMapIntensity={2.2} />
          </mesh>
          <mesh position={[0, -0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.5, 0.012, 12, 48]} />
            <meshStandardMaterial color={0xb8b2a8} metalness={1.0} roughness={0.2} envMapIntensity={1.8} />
          </mesh>
        </group>

        <group ref={nozzleGroup} position={[0, 1.35, 0]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.05, 0.25, 24]} />
            <meshStandardMaterial
              ref={setNozzleMat(0)}
              color={0xdad7cf}
              metalness={1.0}
              roughness={0.3}
              transparent
              opacity={0}
              envMapIntensity={1.2}
            />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <sphereGeometry args={[0.038, 16, 16]} />
            <meshStandardMaterial
              ref={setNozzleMat(1)}
              color={0xc8c4ba}
              metalness={1.0}
              roughness={0.25}
              transparent
              opacity={0}
              envMapIntensity={1.5}
            />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <torusGeometry args={[0.048, 0.008, 12, 24]} />
            <meshStandardMaterial
              ref={setNozzleMat(2)}
              color={0xb0aca4}
              metalness={1.0}
              roughness={0.35}
              transparent
              opacity={0}
              envMapIntensity={1}
            />
          </mesh>
        </group>

        <mesh ref={logoMesh} position={[0, 0.05, 0.45]}>
          <planeGeometry args={[0.58, 0.22]} />
          <meshBasicMaterial map={logoTexture} transparent opacity={0.7} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
});

function explodeAmount(p: number): number {
  if (p < 0.60) return 0;
  if (p < 0.66) return smoothstep(0.60, 0.66, p);
  if (p < 0.70) return 1;
  if (p < 0.735) return 1 - smoothstep(0.70, 0.735, p);
  return 0;
}

function dissolveAmount(p: number): number {
  const start = 0.905, mid = 0.928, end = 0.955;
  if (p < start || p > end) return 0;
  if (p < mid) return smoothstep(start, mid, p);
  return 1 - smoothstep(mid, end, p);
}

export default EliteBottle;
