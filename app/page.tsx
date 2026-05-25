import { VideoUploadInterface } from "@/components/video-upload-interface";
import { PrometheusShell } from "@/components/prometheus-shell";
import { UploadErrorBoundary } from "@/components/error-boundaries/UploadErrorBoundary";
import { LandingHeader } from "@/components/LandingHeader";
import { PricingSection } from "@/components/PricingSection";

export default function HeroPage() {
  return (
    <PrometheusShell header={<LandingHeader />}>
      <UploadErrorBoundary>
        <div className="pt-20">
          <VideoUploadInterface />
        </div>
        
        <div id="pricing" className="mt-32 pb-32">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                Choose the plan that fits your production needs.
              </p>
            </div>
            <PricingSection />
          </div>
        </div>
      </UploadErrorBoundary>
    </PrometheusShell>
  );
}
