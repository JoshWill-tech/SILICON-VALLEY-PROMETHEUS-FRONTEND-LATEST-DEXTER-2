"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ChromeText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("bg-gradient-to-b from-white to-chrome-400 bg-clip-text text-transparent", className)}>
      {children}
    </span>
  );
}
