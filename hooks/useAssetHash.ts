'use client';

import { useState, useCallback, useRef } from 'react';

export interface HashState {
  hash: string;
  progress: number;
  isHashing: boolean;
  error: string | null;
}

export function useAssetHash() {
  const [state, setState] = useState<HashState>({
    hash: '',
    progress: 0,
    isHashing: false,
    error: null,
  });
  
  const workerRef = useRef<Worker | null>(null);

  const hashFile = useCallback((file: File) => {
    setState({ hash: '', progress: 0, isHashing: true, error: null });

    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker(new URL('../lib/workers/hash-worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, bytesRead, hash, message } = e.data;
      
      if (type === 'progress') {
        setState((s) => ({ ...s, progress: bytesRead }));
      } else if (type === 'complete') {
        setState((s) => ({ ...s, hash, isHashing: false, progress: file.size }));
        worker.terminate();
        workerRef.current = null;
      } else if (type === 'error') {
        setState((s) => ({ ...s, error: message, isHashing: false }));
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.postMessage({ file });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  return { ...state, hashFile };
}
