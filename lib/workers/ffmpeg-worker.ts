// lib/workers/ffmpeg-worker.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

const CORE_VERSION = '0.12.6';
const BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  return ffmpeg;
}

self.onmessage = async (e: MessageEvent) => {
  const { type, videoUrl, interval = 5, deviceTier = 'medium' } = e.data;

  if (type === 'extract-thumbnails') {
    try {
      const instance = await loadFFmpeg();
      
      // Write file
      await instance.writeFile('input.mp4', await fetchFile(videoUrl));

      // Determine scaling based on tier
      const scale = deviceTier === 'low' ? '160:-1' : '320:-1';

      // Extract
      await instance.exec([
        '-i', 'input.mp4',
        '-vf', `fps=1/${interval},scale=${scale}`,
        '-q:v', '4', // Higher compression for mobile
        'thumb_%04d.webp'
      ]);

      const files = await instance.listDir('.');
      const thumbFiles = files
        .filter(f => f.name.startsWith('thumb_') && f.name.endsWith('.webp'))
        .sort((a, b) => a.name.localeCompare(b.name));

      const thumbnails = [];
      for (let i = 0; i < thumbFiles.length; i++) {
        const data = await instance.readFile(thumbFiles[i].name);
        // We can't send Blobs easily if they contain non-transferable data, 
        // but Uint8Array is fine.
        thumbnails.push({
          time: i * interval * 1000,
          data: data, // Uint8Array
        });
      }

      self.postMessage({ type: 'complete', thumbnails });

      // Cleanup
      await instance.deleteFile('input.mp4');
      for (const f of thumbFiles) {
        await instance.deleteFile(f.name);
      }
    } catch (error: any) {
      self.postMessage({ type: 'error', message: error.message });
    }
  }
};
