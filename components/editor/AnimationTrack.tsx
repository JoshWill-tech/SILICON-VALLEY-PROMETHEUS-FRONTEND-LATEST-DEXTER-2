"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

const segments = [
  { start: 2, end: 8, type: "fade-in" },
  { start: 10, end: 15, type: "slide-up" },
  { start: 20, end: 25, type: "pulse" },
];

type TrackColor = "accent-cyan" | "accent-gold";

export function AnimationTrack({
  label,
  color,
  duration,
  zoom,
}: {
  label: string;
  color: TrackColor;
  duration: number;
  zoom: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const colorClasses =
    color === "accent-cyan"
      ? "border-accent-cyan/30 bg-accent-cyan/20 hover:shadow-glow-cyan"
      : "border-accent-gold/30 bg-accent-gold/20 hover:shadow-glow-gold";

  return (
    <div className="relative h-14 rounded-lg border border-border-subtle bg-surface-elevated px-2">
      <span className="absolute -top-2 left-2 bg-surface-base px-1 text-[10px] uppercase tracking-wider text-text-tertiary">
        {label}
      </span>
      <div className="relative h-full" style={{ width: `${duration * 10 * zoom}px` }}>
        {segments.map((segment) => (
          <motion.div
            key={`${label}-${segment.start}-${segment.type}`}
            className={cn(
              "absolute top-2 h-8 cursor-pointer rounded-md border transition-shadow",
              colorClasses
            )}
            style={{
              left: `${segment.start * 10 * zoom}px`,
              width: `${(segment.end - segment.start) * 10 * zoom}px`,
            }}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
          >
            <span className="flex h-full items-center overflow-hidden px-2 text-xs text-text-secondary">
              <span className="truncate">{segment.type}</span>
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
