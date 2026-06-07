"use client";

import { useEffect, useRef } from "react";

import { useDeviceTier } from "@/hooks/useDeviceTier";

export function LiquidChromeOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tier = useDeviceTier();

  useEffect(() => {
    const canvas = canvasRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canvas || tier !== "high" || reduceMotion) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(window.innerWidth * dpr);
      canvas.height = Math.ceil(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    let time = 0;
    const draw = () => {
      time += 0.005;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const width = window.innerWidth;
      const height = window.innerHeight;
      const centerX = width * 0.5 + Math.sin(time) * 18;
      const centerY = height * 0.28 + Math.cos(time * 0.7) * 12;
      const radius = Math.min(width, height) * 0.45;

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, "rgba(0, 240, 255, 0.028)");
      gradient.addColorStop(0.48, "rgba(255, 255, 255, 0.012)");
      gradient.addColorStop(1, "rgba(10, 10, 12, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
  }, [tier]);

  if (tier === "low") {
    return null;
  }

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0 opacity-60" aria-hidden />;
}
