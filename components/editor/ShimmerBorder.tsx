"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ShimmerBorder({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden border border-border-subtle", className)}>
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent bg-chrome-shine bg-[length:200%_100%] animate-shimmer motion-reduce:animate-none"
        style={{
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
        }}
        aria-hidden
      />
      {children}
    </div>
  );
}
