"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Download, Sparkles, Upload, Video, X } from "lucide-react";

import { useDeviceTier } from "@/hooks/useDeviceTier";

const actions = [
  { id: "new-project", label: "New Project", shortcut: "⌘N", icon: Video },
  { id: "upload-video", label: "Upload Video", shortcut: "⌘U", icon: Upload },
  { id: "interrogate", label: "Interrogate", shortcut: "⌘I", icon: Sparkles },
  { id: "export", label: "Export", shortcut: "⌘⇧E", icon: Download },
];

function fuzzyMatch(label: string, query: string) {
  if (!query.trim()) return true;

  let cursor = 0;
  const normalized = label.toLowerCase();
  const needle = query.toLowerCase();

  for (const char of normalized) {
    if (char === needle[cursor]) cursor += 1;
    if (cursor === needle.length) return true;
  }

  return false;
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const tier = useDeviceTier();
  const panelClass =
    tier === "low"
      ? "border border-border-subtle bg-surface-elevated shadow-floating"
      : "glass-panel border border-border-subtle shadow-floating";

  const filteredActions = useMemo(
    () => actions.filter((action) => fuzzyMatch(action.label, query)),
    [query]
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelected((current) => Math.min(current + 1, Math.max(filteredActions.length - 1, 0)));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelected((current) => Math.max(current - 1, 0));
        return;
      }

      if (event.key === "Enter" && filteredActions[selected]) {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredActions, onClose, selected]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-command-title"
        className={`${panelClass} w-[90%] max-w-md rounded-2xl p-3`}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(0);
            }}
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-border-subtle bg-surface-base px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-cyan"
            placeholder="Search commands"
            aria-labelledby="mobile-command-title"
          />
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-text-tertiary transition-colors hover:bg-white/5 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
            aria-label="Close command palette"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 id="mobile-command-title" className="sr-only">
          Command palette
        </h2>

        <div className="space-y-1" role="listbox" aria-label="Commands">
          {filteredActions.map((action, index) => {
            const Icon = action.icon;
            const isSelected = selected === index;

            return (
              <button
                key={action.id}
                type="button"
                onClick={onClose}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan ${
                  isSelected ? "bg-accent-cyan-glow text-accent-cyan" : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{action.label}</span>
                <kbd className="rounded bg-surface-floating px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
                  {action.shortcut}
                </kbd>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
