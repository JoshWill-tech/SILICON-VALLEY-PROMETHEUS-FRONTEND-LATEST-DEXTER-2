"use client";

import { useEffect, useRef } from "react";

import { useContextualFlags } from "./useContextualFlags";

const IDLE_MS = 1000 * 60 * 10;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"] as const;

export function useActivityDetector() {
  const { flagReturnedFromBreak } = useContextualFlags();
  const lastActive = useRef(0);

  useEffect(() => {
    lastActive.current = Date.now();

    const onActivity = () => {
      const now = Date.now();

      if (now - lastActive.current > IDLE_MS) {
        flagReturnedFromBreak();
      }

      lastActive.current = now;
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        lastActive.current = Date.now();
        return;
      }

      if (Date.now() - lastActive.current > IDLE_MS) {
        flagReturnedFromBreak();
        lastActive.current = Date.now();
      }
    };

    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, onActivity));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flagReturnedFromBreak]);
}
