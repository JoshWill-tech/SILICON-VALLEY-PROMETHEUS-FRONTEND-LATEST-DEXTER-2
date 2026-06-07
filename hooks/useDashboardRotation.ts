"use client";

import { useCallback, useEffect, useState } from "react";

import { getContextualFlag } from "./useContextualFlags";

export type DashboardPreset = "existing" | "geometric" | "blob" | "cinematic" | "tools";

interface RotationState {
  preset: DashboardPreset;
  date: string;
  pinned: boolean;
  context?: string;
}

const STORAGE_KEY = "prometheus-dashboard-preset";
const PRESETS: DashboardPreset[] = ["existing", "geometric", "blob", "cinematic"];

function getLocalDate(): string {
  return new Date().toLocaleDateString("en-CA");
}

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash &= hash;
  }

  return Math.abs(hash);
}

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function writeStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

function selectHash(date: string): DashboardPreset {
  return PRESETS[hashString(date) % PRESETS.length];
}

function selectContextual(): DashboardPreset {
  const hour = new Date().getHours();
  const hasProjects = readStorage("prometheus-project-count");
  const lastAction = getContextualFlag("last-action");
  const isFirst = !readStorage("prometheus-visited");

  if (isFirst) return "geometric";
  if (lastAction === "pasted-video" || lastAction === "uploaded-video") return "tools";
  if (lastAction === "opened-editor" || lastAction === "interrogated" || lastAction === "exported-video") return "existing";
  if (hasProjects && hour >= 6 && hour < 12) return "cinematic";
  if (hasProjects) return "existing";
  if (hour >= 18 || hour < 6) return "blob";
  return selectHash(getLocalDate());
}

function parseStoredState(raw: string | null): RotationState | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<RotationState>;
    if (!parsed.preset || !parsed.date || typeof parsed.pinned !== "boolean") return null;
    if (!["existing", "geometric", "blob", "cinematic", "tools"].includes(parsed.preset)) return null;

    return {
      preset: parsed.preset,
      date: parsed.date,
      pinned: parsed.pinned,
      context: parsed.context,
    };
  } catch {
    return null;
  }
}

function persistState(next: RotationState) {
  writeStorage(STORAGE_KEY, JSON.stringify(next));
}

export function useDashboardRotation() {
  const [state, setState] = useState<RotationState>(() => ({
    preset: "existing",
    date: getLocalDate(),
    pinned: false,
  }));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const today = getLocalDate();
    const parsed = parseStoredState(readStorage(STORAGE_KEY));
    const next =
      parsed?.pinned || parsed?.date === today
        ? { ...parsed, date: parsed.pinned ? today : parsed.date }
        : { preset: selectContextual(), date: today, pinned: false, context: "auto" };

    if (!parsed?.pinned && parsed?.date !== today) {
      persistState(next);
      writeStorage("prometheus-visited", "true");
    }

    queueMicrotask(() => {
      setState(next);
      setReady(true);
    });
  }, []);

  const pin = useCallback((preset: DashboardPreset) => {
    const next: RotationState = { preset, date: getLocalDate(), pinned: true };
    persistState(next);
    setState(next);
  }, []);

  const unpin = useCallback(() => {
    const next: RotationState = {
      preset: selectContextual(),
      date: getLocalDate(),
      pinned: false,
      context: "auto",
    };
    persistState(next);
    setState(next);
  }, []);

  const cycle = useCallback(() => {
    const index = PRESETS.indexOf(state.preset);
    const nextPreset = PRESETS[(index + 1) % PRESETS.length];
    const next: RotationState = {
      preset: nextPreset,
      date: getLocalDate(),
      pinned: false,
      context: "manual",
    };
    persistState(next);
    setState(next);
  }, [state.preset]);

  return { ...state, ready, pin, unpin, cycle };
}
