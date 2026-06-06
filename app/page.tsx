import { headers } from "next/headers";
import { PrometheusDashboard } from "@/components/chat/PrometheusDashboard";
import { ZusPreset } from "@/components/chat/presets/ZusPreset";
import { PresetId } from "@/lib/presets/daily-preset";

export default async function HeroPage() {
  const headersList = await headers();
  const botPreset = headersList.get('x-preset-override') as PresetId | null;

  if (botPreset === 'zus') {
    // Return a stable, static version for bots (minimal interactivity, full content)
    return <ZusPreset />;
  }

  return (
    <PrometheusDashboard />
  );
}
