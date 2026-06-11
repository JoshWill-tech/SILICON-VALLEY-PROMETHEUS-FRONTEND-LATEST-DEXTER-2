"use client";

import { useDeviceTier } from "@/hooks/useDeviceTier";

export function AmbientGlow() {
  const tier = useDeviceTier();

  if (tier === "low") {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-70 motion-reduce:opacity-40"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(0,240,255,0.045),transparent_34%,rgba(255,215,0,0.03)_68%,transparent)] motion-reduce:animate-none" />
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent)]" />
    </div>
  );
}
