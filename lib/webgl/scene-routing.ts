export function getSceneRouteFlags(pathname: string | null | undefined) {
  const normalizedPath = pathname || '/'

  return {
    hero: normalizedPath === '/',
    dashboard: normalizedPath === '/projects',
    editor: normalizedPath.startsWith('/editor/'),
  }
}

export function isMobileWebglMode(hardwareConcurrency: number | null | undefined) {
  return typeof hardwareConcurrency === 'number' && hardwareConcurrency < 4
}

export function getSceneDpr(input: {
  devicePixelRatio: number | null | undefined
  maxDpr: number
  mobileMode: boolean
}) {
  if (input.mobileMode) return 0.5
  return Math.min(input.devicePixelRatio || 1, input.maxDpr)
}
