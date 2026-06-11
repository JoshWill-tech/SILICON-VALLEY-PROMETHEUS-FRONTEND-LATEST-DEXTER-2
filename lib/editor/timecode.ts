/**
 * Formats seconds into a timecode string MM:SS or HH:MM:SS.FF
 */
export function formatTimecode(seconds: number, options: { fps?: number; showFrames?: boolean } = {}): string {
  const { fps = 30, showFrames = false } = options;
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * fps);

  const parts = [
    h > 0 ? h.toString().padStart(2, '0') : null,
    m.toString().padStart(2, '0'),
    s.toString().padStart(2, '0')
  ].filter(Boolean);

  let result = parts.join(':');
  if (showFrames) {
    result += `.${f.toString().padStart(2, '0')}`;
  }
  
  return result;
}

/**
 * Parses a timecode string into seconds
 */
export function parseTimecode(timecode: string, fps = 30): number {
  const parts = timecode.split(/[:.]/);
  if (parts.length < 2) return 0;

  let h = 0, m = 0, s = 0, f = 0;

  if (parts.length === 4) {
    [h, m, s, f] = parts.map(Number);
  } else if (parts.length === 3) {
    [m, s, f] = parts.map(Number);
  } else if (parts.length === 2) {
    [m, s] = parts.map(Number);
  }

  return (h * 3600) + (m * 60) + s + (f / fps);
}
