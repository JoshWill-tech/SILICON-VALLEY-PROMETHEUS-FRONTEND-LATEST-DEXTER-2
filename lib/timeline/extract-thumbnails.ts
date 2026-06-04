import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

export async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  return ffmpeg;
}

export interface ThumbnailFrame {
  time: number;
  url: string;
}

export async function extractThumbnails(
  videoUrl: string, 
  intervalInSeconds: number = 1
): Promise<ThumbnailFrame[]> {
  const instance = await loadFFmpeg();
  
  // Write file to virtual FS
  await instance.writeFile("input.mp4", await fetchFile(videoUrl));

  // Extract frames every N seconds
  // -vf "fps=1/interval"
  await instance.exec([
    "-i", "input.mp4",
    "-vf", `fps=1/${intervalInSeconds},scale=320:-1`,
    "-q:v", "2",
    "frame_%04d.webp"
  ]);

  const files = await instance.listDir(".");
  const frameFiles = files
    .filter(f => f.name.startsWith("frame_") && f.name.endsWith(".webp"))
    .sort((a, b) => a.name.localeCompare(b.name));

  const thumbnails: ThumbnailFrame[] = [];

  for (let i = 0; i < frameFiles.length; i++) {
    const data = await instance.readFile(frameFiles[i].name);
    const blob = new Blob([data as any], { type: "image/webp" });
    thumbnails.push({
      time: i * intervalInSeconds * 1000,
      url: URL.createObjectURL(blob)
    });
  }

  // Cleanup virtual FS
  await instance.deleteFile("input.mp4");
  for (const f of frameFiles) {
    await instance.deleteFile(f.name);
  }

  return thumbnails;
}
