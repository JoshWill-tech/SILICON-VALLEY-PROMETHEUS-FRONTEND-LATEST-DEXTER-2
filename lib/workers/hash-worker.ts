// lib/workers/hash-worker.ts
import { createSHA256 } from 'hash-wasm';

self.onmessage = async (e: MessageEvent) => {
  const { file } = e.data;
  if (!file) return;

  try {
    const hasher = await createSHA256();
    hasher.init();

    const stream = file.stream();
    const reader = stream.getReader();
    let bytesRead = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      hasher.update(value);
      bytesRead += value.length;
      
      self.postMessage({ type: 'progress', bytesRead, totalBytes: file.size });
    }

    const hash = hasher.digest();
    self.postMessage({ type: 'complete', hash });
  } catch (error: any) {
    self.postMessage({ type: 'error', message: error.message });
  }
};
