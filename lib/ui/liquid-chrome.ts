export type Point = { x: number; y: number }

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function getSheenPosition(input: {
  clientX: number
  clientY: number
  rect: { left: number; top: number; width: number; height: number }
}) {
  const x = clamp(((input.clientX - input.rect.left) / input.rect.width) * 100, 0, 100)
  const y = clamp(((input.clientY - input.rect.top) / input.rect.height) * 100, 0, 100)

  return { x, y }
}

export function getMagneticTarget(input: {
  clientX: number
  clientY: number
  rect: { left: number; top: number; width: number; height: number }
  radius?: number
  maxOffset?: number
}): Point {
  const radius = input.radius ?? 100
  const maxOffset = input.maxOffset ?? 4
  const centerX = input.rect.left + input.rect.width / 2
  const centerY = input.rect.top + input.rect.height / 2
  const distX = input.clientX - centerX
  const distY = input.clientY - centerY
  const distance = Math.hypot(distX, distY)

  if (distance === 0 || distance > radius) return { x: 0, y: 0 }

  const strength = (radius - distance) / radius

  return {
    x: (distX / distance) * maxOffset * strength,
    y: (distY / distance) * maxOffset * strength,
  }
}

export function lerpPoint(current: Point, target: Point, factor = 0.15): Point {
  return {
    x: current.x + (target.x - current.x) * factor,
    y: current.y + (target.y - current.y) * factor,
  }
}

export function getRippleOrigin(input: {
  clientX: number
  clientY: number
  rect: { left: number; top: number }
}) {
  return {
    x: input.clientX - input.rect.left,
    y: input.clientY - input.rect.top,
  }
}
