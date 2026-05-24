import { VideoUploadInterface } from "@/components/video-upload-interface";
import { PrometheusShell } from "@/components/prometheus-shell";
import { UploadErrorBoundary } from "@/components/error-boundaries/UploadErrorBoundary";

export default function HeroPage() {
  return (
    <PrometheusShell>
      <UploadErrorBoundary>
        <VideoUploadInterface />
      </UploadErrorBoundary>
    </PrometheusShell>
  );
}
