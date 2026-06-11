"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useDeviceTier } from "@/hooks/useDeviceTier";

export function GlassTiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const tier = useDeviceTier();
  const tiltEnabled = tier === "high" && !shouldReduceMotion;

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !tiltEnabled) {
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    setRotateX((y - 0.5) * -8);
    setRotateY((x - 0.5) * 8);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={tiltEnabled ? { rotateX, rotateY } : { rotateX: 0, rotateY: 0 }}
      transition={tiltEnabled ? { type: "spring", stiffness: 300, damping: 30 } : { duration: 0 }}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      className={cn("glass-panel", className)}
    >
      {children}
    </motion.div>
  );
}
