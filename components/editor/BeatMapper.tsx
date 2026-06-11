"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";

import { useDeviceTier } from "@/hooks/useDeviceTier";

interface Beat {
  time: number;
  type: string;
  intensity: number;
}

export function BeatMapper({
  beats,
  targetRef,
}: {
  beats: Beat[];
  targetRef: RefObject<HTMLElement | null>;
}) {
  const tier = useDeviceTier();

  useEffect(() => {
    const target = targetRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!target || beats.length === 0 || tier === "low" || reduceMotion) {
      return;
    }

    const timeline = gsap.timeline();

    beats.forEach((beat) => {
      const at = beat.time;

      if (beat.type === "emphasis") {
        timeline.to(
          target,
          { scale: 1 + beat.intensity * 0.1, duration: 0.3, ease: "back.out(1.7)" },
          at
        );
        timeline.to(target, { scale: 1, duration: 0.2 }, at + 0.3);
      }

      if (beat.type === "build") {
        timeline.to(target, { y: -beat.intensity * 20, duration: 0.4, ease: "power2.out" }, at);
        timeline.to(target, { y: 0, duration: 0.3 }, at + 0.4);
      }

      if (beat.type === "climax") {
        timeline.to(target, { rotation: beat.intensity * 5, duration: 0.2, ease: "power1.in" }, at);
        timeline.to(target, { rotation: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" }, at + 0.2);
      }
    });

    timeline.play(0);

    return () => {
      timeline.kill();
      gsap.set(target, { clearProps: "transform" });
    };
  }, [beats, targetRef, tier]);

  return null;
}
