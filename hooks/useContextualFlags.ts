"use client";

import { useCallback } from "react";

export type ContextualAction =
  | "pasted-video"
  | "uploaded-video"
  | "created-project"
  | "deleted-project"
  | "exported-video"
  | "interrogated"
  | "opened-editor"
  | "returned-from-break";

const PREFIX = "prometheus-";
const TTL_MS = 1000 * 60 * 60 * 4;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function setFlag(key: string, value: string, ttl?: number) {
  if (!canUseStorage()) return;

  const payload = ttl ? JSON.stringify({ value, expires: Date.now() + ttl }) : value;
  window.localStorage.setItem(`${PREFIX}${key}`, payload);
}

export function getContextualFlag(key: string): string | null {
  if (!canUseStorage()) return null;

  const storageKey = `${PREFIX}${key}`;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { value?: unknown; expires?: unknown };
    if (typeof parsed.expires === "number" && Date.now() > parsed.expires) {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    return typeof parsed.value === "string" ? parsed.value : null;
  } catch {
    return raw;
  }
}

function readProjectCount() {
  if (!canUseStorage()) return 0;

  const count = Number.parseInt(window.localStorage.getItem(`${PREFIX}project-count`) || "0", 10);
  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

export function useContextualFlags() {
  const flagPastedVideo = useCallback(() => setFlag("last-action", "pasted-video", TTL_MS), []);
  const flagUploadedVideo = useCallback(() => setFlag("last-action", "uploaded-video", TTL_MS), []);
  const flagCreatedProject = useCallback(() => {
    setFlag("last-action", "created-project", TTL_MS);
    if (!canUseStorage()) return;

    window.localStorage.setItem(`${PREFIX}project-count`, (readProjectCount() + 1).toString());
  }, []);
  const flagDeletedProject = useCallback(() => {
    if (!canUseStorage()) return;

    window.localStorage.setItem(`${PREFIX}project-count`, Math.max(0, readProjectCount() - 1).toString());
    setFlag("last-action", "deleted-project", TTL_MS);
  }, []);
  const flagExportedVideo = useCallback(() => setFlag("last-action", "exported-video", TTL_MS), []);
  const flagInterrogated = useCallback(() => setFlag("last-action", "interrogated", TTL_MS), []);
  const flagOpenedEditor = useCallback(() => setFlag("last-action", "opened-editor", TTL_MS), []);
  const flagReturnedFromBreak = useCallback(() => setFlag("last-action", "returned-from-break", TTL_MS), []);
  const getProjectCount = useCallback(() => readProjectCount(), []);
  const getLastAction = useCallback(() => getContextualFlag("last-action") as ContextualAction | null, []);
  const clearFlags = useCallback(() => {
    if (!canUseStorage()) return;

    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX) && key !== `${PREFIX}visited`)
      .forEach((key) => window.localStorage.removeItem(key));
  }, []);

  return {
    flagPastedVideo,
    flagUploadedVideo,
    flagCreatedProject,
    flagDeletedProject,
    flagExportedVideo,
    flagInterrogated,
    flagOpenedEditor,
    flagReturnedFromBreak,
    getProjectCount,
    getLastAction,
    clearFlags,
  };
}
