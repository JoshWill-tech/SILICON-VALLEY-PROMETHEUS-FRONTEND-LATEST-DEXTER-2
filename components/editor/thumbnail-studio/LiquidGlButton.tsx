'use client'

import * as React from 'react'

interface LiquidGlButtonProps {
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  disabled?: boolean
  isGenerating?: boolean
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

/**
 * LiquidGlButton
 * Recreates the Apple-style Liquid Glass treatment from liquidgl.naughtyduk.com
 * using a WebGL shader with fluid pointer interaction, chromatic aberration,
 * corner normal beveled refraction, and dual moving specular highlights.
 */
export function LiquidGlButton({
  type = 'button',
  onClick,
  disabled = false,
  isGenerating = false,
  className = '',
  style,
  children,
}: LiquidGlButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  // Fluid physics & pointer state
  const stateRef = React.useRef({
    curX: 0.5,
    curY: 0.5,
    targetX: 0.5,
    targetY: 0.5,
    velX: 0,
    velY: 0,
    isHovered: false,
    startTime: 0,
    animating: true,
  })

  React.useEffect(() => {
    stateRef.current.startTime = performance.now()
  }, [])

  React.useEffect(() => {
    const canvas = canvasRef.current
    const button = buttonRef.current
    if (!canvas || !button) return

    let gl: WebGLRenderingContext | null = null
    try {
      gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
        powerPreference: 'high-performance',
      })
    } catch {
      // Fallback to CSS
      return
    }

    if (!gl) return

    // Vertex shader
    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    // Fragment shader based on NaughtyDuk LiquidGL architecture
    const fsSource = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif

      varying vec2 v_uv;
      uniform vec2 u_resolution;
      uniform float u_radius;
      uniform float u_time;
      uniform vec4 u_tint;
      uniform vec4 u_interaction; // x, y: normalized pointer; z, w: fluid displacement velocity
      uniform float u_interactionRadius;
      uniform float u_interactionStrength;
      uniform float u_bevelDepth;
      uniform float u_aberration;
      uniform float u_refraction;
      uniform float u_isGenerating;
      uniform float u_isHovered;

      float udRoundBox(vec2 p, vec2 b, float r) {
        return length(max(abs(p) - b + r, 0.0)) - r;
      }

      vec2 cornerNormal(vec2 p, vec2 b, float r, vec2 fallback) {
        vec2 q = abs(p) - b + r;
        vec2 m = max(q, 0.0);
        float l = length(m);
        if (l <= 0.0) return fallback;
        float w = smoothstep(0.0, max(r * 0.5, 1.0), min(m.x, m.y));
        if (w <= 0.0) return fallback;
        vec2 s = vec2(p.x < 0.0 ? -1.0 : 1.0, p.y < 0.0 ? -1.0 : 1.0);
        return normalize(mix(fallback, s * (m / l), w));
      }

      vec2 deformPoint(vec2 point, vec2 b_px) {
        if (u_interactionRadius <= 0.0) return point;
        vec2 centre = (vec2(u_interaction.x, 1.0 - u_interaction.y) - 0.5) * (b_px * 2.0);
        float reach = u_interactionRadius * min(b_px.x * 2.0, b_px.y * 2.0);
        float dist = length(point - centre);
        float influence = 1.0 - smoothstep(0.0, reach, dist);
        
        vec2 displacement = vec2(u_interaction.z, -u_interaction.w) * (b_px * 2.0) * influence * u_interactionStrength;
        
        if (u_isGenerating > 0.5) {
          displacement += vec2(
            sin(point.x * 0.06 + u_time * 4.0),
            cos(point.y * 0.12 + u_time * 3.2)
          ) * 2.5;
        }
        return point - displacement;
      }

      void main() {
        vec2 b_px = 0.5 * u_resolution;
        vec2 originalPoint = (v_uv - 0.5) * u_resolution;
        vec2 p_px = deformPoint(originalPoint, b_px);
        vec2 p = p_px / u_resolution.y;

        // Rounded box distance field
        float dmask = udRoundBox(p_px, b_px, u_radius);
        float inShape = 1.0 - smoothstep(-0.8, 0.8, dmask);
        if (inShape <= 0.001) {
          discard;
        }

        // Edge bevel calculation
        float bevel_px = 0.22 * min(u_resolution.x, u_resolution.y);
        float d = -udRoundBox(p_px, b_px, u_radius);
        float edge = 1.0 - smoothstep(0.0, bevel_px, d);
        float offsetAmt = (edge * u_refraction + pow(edge, 7.0) * u_bevelDepth);
        float centreBlend = smoothstep(0.12, 0.45, length(p));
        vec2 refractDir = cornerNormal(p_px, b_px, u_radius, normalize(p + vec2(0.000001)));

        // Fluid ripple deformation on normals
        if (u_interactionRadius > 0.0) {
          vec2 grad = vec2(
            udRoundBox(deformPoint(originalPoint + vec2(1.0, 0.0), b_px), b_px, u_radius) -
            udRoundBox(deformPoint(originalPoint - vec2(1.0, 0.0), b_px), b_px, u_radius),
            udRoundBox(deformPoint(originalPoint + vec2(0.0, 1.0), b_px), b_px, u_radius) -
            udRoundBox(deformPoint(originalPoint - vec2(0.0, 1.0), b_px), b_px, u_radius)
          );
          if (length(grad) > 0.0001) {
            refractDir = normalize(mix(refractDir, normalize(grad), min(length(p_px - originalPoint) * 0.25, 1.0)));
          }
        }

        vec2 offset = refractDir * offsetAmt * centreBlend;

        // Base liquid glass tone (Prometheus luminous cyan-mint dye)
        vec3 glass = u_tint.rgb;
        glass *= (0.94 + 0.14 * (1.0 - v_uv.y)); // subtle vertical gradient

        // Chromatic aberration along the refraction vector
        if (u_aberration > 0.0) {
          float disp = (offset.x + offset.y) * u_aberration * 0.35;
          glass.r += disp * 0.4;
          glass.b -= disp * 0.4;
        }

        // Dual specular light sources (Apple liquid glass glossy highlights)
        vec2 lp1 = vec2(sin(u_time * 0.5), cos(u_time * 0.7)) * 0.45 + 0.5;
        vec2 lp2 = vec2(sin(u_time * -0.4 + 1.8), cos(u_time * 0.35 - 0.8)) * 0.45 + 0.5;
        float spec = 0.0;
        spec += smoothstep(0.42, 0.0, distance(v_uv, lp1)) * 0.16;
        spec += smoothstep(0.48, 0.0, distance(v_uv, lp2)) * 0.12;

        // Top edge crystal rim reflection
        float topRim = smoothstep(2.2, 0.4, abs(p_px.y - (b_px.y - u_radius * 0.35))) * 
                       smoothstep(b_px.x, 0.0, abs(p_px.x)) * 0.28;
        spec += topRim;

        // Extra hover sheen
        if (u_isHovered > 0.5) {
          vec2 hoverPos = vec2(u_interaction.x, 1.0 - u_interaction.y);
          spec += smoothstep(0.35, 0.0, distance(v_uv, hoverPos)) * 0.22;
        }

        glass += vec3(spec);

        // Edge fresnel glow
        glass += vec3(pow(edge, 3.5) * 0.25);

        float alpha = inShape * u_tint.a;
        gl_FragColor = vec4(glass, alpha);
      }
    `

    function compileShader(type: number, src: string) {
      if (!gl) return null
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, src)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('LiquidGL shader error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vs = compileShader(gl.VERTEX_SHADER, vsSource)
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource)
    if (!vs || !fs) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      return
    }

    gl.useProgram(program)

    // Setup full-screen quad
    const posBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )
    const aPos = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    // Uniform locations
    const uResolution = gl.getUniformLocation(program, 'u_resolution')
    const uRadius = gl.getUniformLocation(program, 'u_radius')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uTint = gl.getUniformLocation(program, 'u_tint')
    const uInteraction = gl.getUniformLocation(program, 'u_interaction')
    const uInteractionRadius = gl.getUniformLocation(program, 'u_interactionRadius')
    const uInteractionStrength = gl.getUniformLocation(program, 'u_interactionStrength')
    const uBevelDepth = gl.getUniformLocation(program, 'u_bevelDepth')
    const uAberration = gl.getUniformLocation(program, 'u_aberration')
    const uRefraction = gl.getUniformLocation(program, 'u_refraction')
    const uIsGenerating = gl.getUniformLocation(program, 'u_isGenerating')
    const uIsHovered = gl.getUniformLocation(program, 'u_isHovered')

    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      if (!canvas || !button || !gl) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = button.getBoundingClientRect()
      width = Math.round(rect.width * dpr)
      height = Math.round(rect.height * dpr)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(button)

    let animationFrameId: number
    let running = true

    const render = (now: number) => {
      if (!running || !gl) return

      const state = stateRef.current
      const elapsed = (now - state.startTime) * 0.001

      // Viscous fluid physics simulation
      const dx = state.targetX - state.curX
      const dy = state.targetY - state.curY
      state.velX = state.velX * 0.88 + dx * 0.12
      state.velY = state.velY * 0.88 + dy * 0.12
      state.curX += state.velX
      state.curY += state.velY

      gl.useProgram(program)
      gl.uniform2f(uResolution, width, height)
      gl.uniform1f(uRadius, 7.0 * dpr) // 7px border radius
      gl.uniform1f(uTime, elapsed)
      // Tint: Prometheus Cyan #7ff2d4 -> RGBA [0.50, 0.95, 0.83, 0.92]
      gl.uniform4f(uTint, 0.498, 0.949, 0.831, 0.92)
      gl.uniform4f(uInteraction, state.curX, state.curY, state.velX, state.velY)
      gl.uniform1f(uInteractionRadius, 0.38)
      gl.uniform1f(uInteractionStrength, 0.65)
      gl.uniform1f(uBevelDepth, 0.14)
      gl.uniform1f(uAberration, 0.35)
      gl.uniform1f(uRefraction, 0.035)
      gl.uniform1f(uIsGenerating, isGenerating ? 1.0 : 0.0)
      gl.uniform1f(uIsHovered, state.isHovered ? 1.0 : 0.0)

      gl.drawArrays(gl.TRIANGLES, 0, 6)

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      running = false
      cancelAnimationFrame(animationFrameId)
      observer.disconnect()
      if (gl) {
        gl.deleteBuffer(posBuffer)
        gl.deleteProgram(program)
        gl.deleteShader(vs)
        gl.deleteShader(fs)
      }
    }
  }, [isGenerating])

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const button = buttonRef.current
    if (!button) return
    const rect = button.getBoundingClientRect()
    const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    stateRef.current.targetX = px
    stateRef.current.targetY = py
    stateRef.current.isHovered = true
  }

  const handlePointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    handlePointerMove(e)
    stateRef.current.isHovered = true
  }

  const handlePointerLeave = () => {
    stateRef.current.isHovered = false
    stateRef.current.targetX = 0.5
    stateRef.current.targetY = 0.5
  }

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={`prom-liquidgl-button ${className}`}
      style={style}
    >
      <canvas ref={canvasRef} className="prom-liquidgl-canvas" aria-hidden="true" />
      <span className="prom-liquidgl-content">{children}</span>
    </button>
  )
}
