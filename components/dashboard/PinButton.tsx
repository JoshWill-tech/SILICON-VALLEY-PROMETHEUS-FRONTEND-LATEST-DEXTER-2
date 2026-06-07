"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Pin, PinOff } from "lucide-react";

import { cn } from "@/lib/utils";

export function PinButton({
  pinned,
  onPin,
  onUnpin,
}: {
  pinned: boolean;
  onPin: () => void;
  onUnpin: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={pinned ? onUnpin : onPin}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
      className={cn(
        "glass-button flex h-8 w-8 items-center justify-center rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan",
        pinned ? "border-accent-gold/30 text-accent-gold shadow-glow-gold" : "text-text-tertiary hover:text-text-primary"
      )}
      aria-pressed={pinned}
      aria-label={pinned ? "Unpin this view" : "Pin this view"}
    >
      <motion.div
        initial={false}
        animate={shouldReduceMotion ? { rotate: 0 } : { rotate: pinned ? 0 : -45 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {pinned ? <Pin className="h-3.5 w-3.5 fill-current" /> : <PinOff className="h-3.5 w-3.5" />}
      </motion.div>
    </motion.button>
  );
}
