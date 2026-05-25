import { VideoUploadInterface } from "@/components/video-upload-interface";
import { PrometheusShell } from "@/components/prometheus-shell";
import { UploadErrorBoundary } from "@/components/error-boundaries/UploadErrorBoundary";
import { LandingHeader } from "@/components/LandingHeader";

export default function HeroPage() {
  return (
    <PrometheusShell header={<LandingHeader />}>
      <UploadErrorBoundary>
        <div className="pt-20">
          <VideoUploadInterface />
        </div>
      </UploadErrorBoundary>
    </PrometheusShell>
  );
}
