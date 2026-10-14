import React from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'Mini-Run Video Review | Prometheus Studio',
  description: 'Side-by-side comparison of raw video and final rendered mini-run short.',
}

const frames = [
  { time: '1.8s', src: '/media/mini-run/frame_1.8s.png', label: 'Intro Shot & Subject Framing' },
  { time: '4.6s', src: '/media/mini-run/frame_4.6s.png', label: 'Cinematic Pan/Scan Reframing' },
  { time: '8.6s', src: '/media/mini-run/frame_8.6s.png', label: 'Kinetic Typography & Occlusion' },
  { time: '15.0s', src: '/media/mini-run/frame_15.0s.png', label: 'Behind-Subject Depth Layering' },
  { time: '22.5s', src: '/media/mini-run/frame_22.5s.png', label: 'Chest Deck Zone Legibility' },
  { time: '28.0s', src: '/media/mini-run/frame_28.0s.png', label: 'Climax & Crimson Bevel / Glow' },
]

export default function MiniRunReviewPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30 rounded">
                Autonomous Cloud Mini-Run
              </span>
              <span className="text-xs text-neutral-400">Modal Studio + MediaPipe 3D</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 text-white">
              Jeff Simons — Thought of the Day
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Deterministic comparison between raw source footage and finished vertical short MP4.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/media/mini-run/final_jeff_simons.mp4"
              download="mini_run_jeff_simons_final.mp4"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 font-medium text-white shadow-lg transition-colors"
            >
              Download Final MP4 (104 MB)
            </a>
          </div>
        </header>

        {/* Video Players Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Raw Video */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-neutral-200">Raw Source Ingest</h2>
                <p className="text-xs text-neutral-400">Original uploaded portrait capture</p>
              </div>
              <span className="px-2 py-0.5 text-xs bg-neutral-800 text-neutral-300 rounded font-mono">4.53 MB</span>
            </div>
            <div className="relative aspect-[9/16] max-h-[620px] mx-auto bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
              <video
                src="/media/mini-run/raw_jeff_simons.mp4"
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs text-neutral-400 space-y-1 font-mono pt-2 border-t border-neutral-800">
              <p>File: <span className="text-neutral-300">TALKING HEAD VID jeff simons THOUGHT OF THEDAY.mp4</span></p>
              <p>Audio: Original mono/stereo vocal capture</p>
              <p>Grading: Flat / rec709 standard</p>
            </div>
          </div>

          {/* Final Rendered Video */}
          <div className="bg-neutral-900 border border-red-900/40 rounded-2xl p-6 shadow-xl space-y-4 relative ring-1 ring-red-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-red-400">Final Mini-Run Short (Delivered)</h2>
                <p className="text-xs text-neutral-400">Full 30-slice autonomous cloud assembly</p>
              </div>
              <span className="px-2 py-0.5 text-xs bg-red-950 text-red-300 border border-red-800/50 rounded font-mono">104.03 MB</span>
            </div>
            <div className="relative aspect-[9/16] max-h-[620px] mx-auto bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
              <video
                src="/media/mini-run/final_jeff_simons.mp4"
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs text-neutral-300 space-y-1 font-mono pt-2 border-t border-neutral-800">
              <p>Resolution: <span className="text-white font-bold">1080 × 1920 (9:16 Vertical)</span></p>
              <p>Duration: <span className="text-white font-bold">30.00 seconds</span> (28.8 Mbps H.264)</p>
              <p>Audio: <span className="text-white font-bold">Isolated speech + Ducked storytelling track</span> (AAC 270k)</p>
              <p>Typography: <span className="text-red-400">Symphony Sanchez Calligraphy Slab</span> (Outfit / Exmouth)</p>
            </div>
          </div>
        </section>

        {/* Conformance Frames Carousel / Grid */}
        <section className="space-y-4 pt-6 border-t border-neutral-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Deterministic Conformance Keyframes</h2>
            <p className="text-sm text-neutral-400">
              Automated pixel-level validation verifying safe margins, behind-subject occlusion depth, and luminance preservation.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {frames.map((frame) => (
              <div key={frame.time} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden group">
                <div className="relative aspect-[9/16] bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frame.src}
                    alt={frame.label}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[11px] font-mono text-white">
                    {frame.time}
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium text-neutral-300 line-clamp-2 leading-tight">
                    {frame.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Telemetry Summary Card */}
        <footer className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 text-sm text-neutral-400 space-y-2">
          <h3 className="text-white font-semibold">Delivery & Verification Audit</h3>
          <p>
            • Autonomous Modal run: <code className="text-neutral-300">mini_run_jeff_simons_1791228687</code><br />
            • 30 cloud slice jobs rendered, matte-keyed via MediaPipe depth silhouette, and muxed with monotonic audio clocks.<br />
            • Direct access URL: <code className="text-neutral-200">http://localhost:3000/mini-run-review</code>
          </p>
        </footer>
      </div>
    </div>
  )
}
