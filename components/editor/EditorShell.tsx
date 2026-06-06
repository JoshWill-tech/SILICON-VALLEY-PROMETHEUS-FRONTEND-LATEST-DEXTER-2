'use client';

import React, { useState, useRef, useCallback } from 'react';
import { MediaBin } from './MediaBin';
import { PreviewViewport } from './PreviewViewport';
import { CinematicTimeline } from './CinematicTimeline';
import { MotionBrainCanvas } from './MotionBrainCanvas';
import { cn } from '@/lib/utils';

export interface EditorShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const EditorShell: React.FC<EditorShellProps> = ({ children, className, ...props }) => {
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(380);
  
  const shellRef = useRef<HTMLDivElement>(null);

  const onHandlePointerDown = useCallback((handler: (e: React.PointerEvent) => void) => (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const moveHandler = (moveEvent: PointerEvent) => {
      handler(moveEvent as unknown as React.PointerEvent);
    };

    const upHandler = () => {
      window.removeEventListener('pointermove', moveHandler);
      window.removeEventListener('pointerup', upHandler);
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {}
    };

    window.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', upHandler);
  }, []);

  const handleLeftDrag = useCallback((e: React.PointerEvent) => {
    if (!shellRef.current) return;
    const rect = shellRef.current.getBoundingClientRect();
    const newWidth = e.clientX - rect.left - 16; // 16 for gap/padding compensation
    setLeftWidth(Math.max(200, Math.min(400, newWidth)));
  }, []);

  const handleRightDrag = useCallback((e: React.PointerEvent) => {
    if (!shellRef.current) return;
    const rect = shellRef.current.getBoundingClientRect();
    const newWidth = rect.right - e.clientX - 16; // 16 for gap/padding compensation
    setRightWidth(Math.max(300, Math.min(480, newWidth)));
  }, []);

  return (
    <div
      ref={shellRef}
      className={cn(
        "flex flex-row w-full h-[calc(100vh-56px)] bg-[var(--abyss)] gap-3 p-4 box-border overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Left Sidebar: Media Bin */}
      <div 
        style={{ width: leftWidth }}
        className="flex-none flex flex-col h-full overflow-hidden relative"
      >
        <MediaBin />
        <div 
          className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-white/10 active:bg-white/20 -mr-1 z-10 transition-colors"
          onPointerDown={(e) => onHandlePointerDown(handleLeftDrag)(e)}
        />
      </div>

      {/* Center: Preview + Timeline */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 h-full overflow-hidden">
        <div className="flex-1 min-h-[40vh]">
          <PreviewViewport />
        </div>
        <div className="flex-none h-[300px]">
          <CinematicTimeline />
        </div>
      </div>

      {/* Right: Motion Brain Canvas */}
      <div 
        style={{ width: rightWidth }}
        className="flex-none flex flex-col h-full overflow-hidden relative"
      >
        <div 
          className="absolute top-0 left-0 w-2 h-full cursor-col-resize hover:bg-white/10 active:bg-white/20 -ml-1 z-10 transition-colors"
          onPointerDown={(e) => onHandlePointerDown(handleRightDrag)(e)}
        />
        <MotionBrainCanvas />
      </div>

      {/* Overlays / Portals */}
      {children}
    </div>
  );
};
