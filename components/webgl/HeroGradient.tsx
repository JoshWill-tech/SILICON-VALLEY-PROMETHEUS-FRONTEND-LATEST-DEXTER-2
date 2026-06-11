'use client'

import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useWebGLSupport } from '@/hooks/useWebGLSupport'
import { isMobileWebglMode } from '@/lib/webgl/scene-routing'

const vertexShader = `
  varying vec2 vUv;
  uniform float uTime;

  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec3 permute(vec3 x) {
    return mod289(((x*34.0)+10.0)*x);
  }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vUv = uv;
    vec3 transformed = position;
    float wave = snoise((uv * 1.8) + vec2(uTime * 0.05, uTime * 0.03));
    transformed.z += wave * 0.18;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`

const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;

  void main() {
    vec2 uv = vUv;
    vec3 deep = vec3(0.04, 0.06, 0.12);
    vec3 mid = vec3(0.10, 0.18, 0.30);
    vec3 accent = vec3(0.22, 0.45, 0.86);
    float pulse = 0.5 + 0.5 * sin(uTime * 0.35 + uv.x * 3.14159);
    float blend = smoothstep(0.0, 1.0, uv.y + pulse * 0.08);
    vec3 color = mix(deep, mid, blend);
    color = mix(color, accent, smoothstep(0.15, 1.0, 1.0 - distance(uv, vec2(0.5, 0.45))));
    gl_FragColor = vec4(color, 0.88);
  }
`

export function HeroGradient() {
  const materialRef = React.useRef<THREE.ShaderMaterial | null>(null)
  const webglSupported = useWebGLSupport()
  const reduceMotion = useReducedMotion()
  const mobileMode =
    typeof navigator !== 'undefined' && isMobileWebglMode(navigator.hardwareConcurrency)

  const geometry = React.useMemo(() => new THREE.PlaneGeometry(9, 7, 96, 96), [])
  const material = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
        },
        vertexShader,
        fragmentShader,
      }),
    [],
  )

  React.useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((state) => {
    if (reduceMotion || !materialRef.current) return
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  if (!webglSupported || mobileMode) return null

  return (
    <mesh geometry={geometry} position={[0, 0, -2]}>
      <primitive ref={materialRef} object={material} attach="material" />
    </mesh>
  )
}
