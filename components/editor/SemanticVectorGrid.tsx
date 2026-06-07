"use client";

import { useMemo } from "react";

interface Vector {
  word: string;
  embedding: number[];
  timestamp: number;
}

export function SemanticVectorGrid({ vectors }: { vectors: Vector[] }) {
  const normalizedVectors = useMemo(
    () =>
      vectors.map((vector) => ({
        ...vector,
        magnitude: Math.sqrt(vector.embedding.reduce((total, value) => total + value * value, 0)),
      })),
    [vectors]
  );

  return (
    <div className="grid grid-cols-4 gap-1">
      {normalizedVectors.map((vector) => (
        <div
          key={`${vector.word}-${vector.timestamp}`}
          className="group relative aspect-square rounded border border-border-subtle bg-surface-elevated p-1 transition-colors hover:border-accent-cyan/30"
          title={`${vector.word} @ ${vector.timestamp.toFixed(1)}s`}
        >
          <div className="absolute inset-0 rounded bg-accent-cyan/10 opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative flex h-full flex-col items-center justify-center">
            <span className="max-w-full truncate text-[10px] text-text-tertiary">{vector.word}</span>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-floating">
              <div
                className="h-full rounded-full bg-accent-cyan"
                style={{ width: `${Math.min(vector.magnitude * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
