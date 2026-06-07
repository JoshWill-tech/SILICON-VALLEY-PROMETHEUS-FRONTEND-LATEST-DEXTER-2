"use client";

const words = [
  { word: "Welcome", start: 0, end: 0.5 },
  { word: "to", start: 0.5, end: 0.7 },
  { word: "Prometheus", start: 0.7, end: 1.4 },
  { word: "the", start: 1.4, end: 1.6 },
  { word: "future", start: 1.6, end: 2.2 },
  { word: "of", start: 2.2, end: 2.4 },
  { word: "content", start: 2.4, end: 3.0 },
];

export function TranscriptStrip({ duration, zoom }: { duration: number; zoom: number }) {
  return (
    <div className="relative h-12 rounded-lg border border-border-subtle bg-surface-elevated px-2">
      <span className="absolute -top-2 left-2 bg-surface-base px-1 text-[10px] uppercase tracking-wider text-text-tertiary">
        Transcript
      </span>
      <div className="relative h-full" style={{ width: `${duration * 10 * zoom}px` }}>
        {words.map((item) => {
          const width = Math.max((item.end - item.start) * 10 * zoom, 44);

          return (
            <span
              key={`${item.word}-${item.start}`}
              className="absolute top-1/2 flex h-7 -translate-y-1/2 cursor-pointer items-center overflow-hidden rounded px-1.5 text-sm text-text-secondary transition-colors hover:bg-accent-cyan-glow hover:text-accent-cyan"
              style={{ left: `${item.start * 10 * zoom}px`, width: `${width}px` }}
              title={item.word}
            >
              <span className="truncate">{item.word}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
