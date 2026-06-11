import dynamic from 'next/dynamic';
import React from 'react';

export function safeDynamic<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: { ssr?: boolean; loading?: () => React.ReactNode }
): T {
  return dynamic(async () => {
    try {
      const mod = await importFn();
      if (!mod.default) throw new Error('Module missing default export');
      return mod as any;
    } catch (err) {
      console.error('[DynamicChunkFail]', err);
      return function ChunkErrorFallback() {
        return (
          <div className="p-4 border border-red-500/30 bg-red-500/10 rounded-lg text-red-400 text-xs font-mono">
            Chunk load failed: {(err as Error).message}
          </div>
        );
      } as unknown as T;
    }
  }, { ssr: false, ...options }) as unknown as T;
}