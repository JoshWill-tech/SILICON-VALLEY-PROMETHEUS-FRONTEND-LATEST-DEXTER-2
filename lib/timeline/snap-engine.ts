export interface SnapPoint {
  timeMs: number;
  type: string;
  strength: number;
}

export function findNearestSnap(cursorMs: number, snaps: SnapPoint[], zoomScale: number): SnapPoint | null {
  const threshold = 500 / zoomScale;
  const candidates = snaps.filter(s => Math.abs(s.timeMs - cursorMs) < threshold);
  if (candidates.length === 0) return null;
  
  return candidates.reduce((best, s) => {
    const score = s.strength * 1000 - Math.abs(s.timeMs - cursorMs);
    return score > best.score ? { snap: s, score } : best;
  }, { snap: candidates[0], score: -Infinity }).snap;
}
