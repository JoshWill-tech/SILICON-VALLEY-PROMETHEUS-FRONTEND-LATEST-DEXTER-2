import { VideoUploadInterface } from "@/components/video-upload-interface";
import { PrometheusShell } from "@/components/prometheus-shell";
import { UploadErrorBoundary } from "@/components/error-boundaries/UploadErrorBoundary";
import { LandingHeader } from "@/components/LandingHeader";

const DELIVERABLES = [
  {
    title: "HD Video Exports",
    description: "Download finished HD and export-ready video files generated from your uploaded footage, prompts, and selected visual style.",
  },
  {
    title: "Custom Motion Templates",
    description: "Create reusable cinematic motion graphics, branded title treatments, transitions, captions, and social video layouts.",
  },
  {
    title: "Caption Timing",
    description: "Generate caption-aware edits, subtitles, searchable notes, and timing data for video production workflows.",
  },
]

export default function HeroPage() {
  return (
    <PrometheusShell header={<LandingHeader />}>
      <UploadErrorBoundary>
        <div className="pt-20">
          <VideoUploadInterface />
        </div>
        <section className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/34">
              Deliverables included with purchase
            </p>
            <h2 className="mt-4 text-3xl font-medium tracking-tight text-white sm:text-4xl">
              What Prometheus Studio customers receive
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/52 sm:text-base">
              Prometheus is an AI-powered cinematic video creation and motion graphics platform. Paid plans include concrete production deliverables such as HD Video Exports, Custom Motion Templates, and Caption Timing.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {DELIVERABLES.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-white/10 bg-white/[0.035] p-6 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)] backdrop-blur-xl"
              >
                <h3 className="text-lg font-medium tracking-tight text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/52">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </UploadErrorBoundary>
    </PrometheusShell>
  );
}
