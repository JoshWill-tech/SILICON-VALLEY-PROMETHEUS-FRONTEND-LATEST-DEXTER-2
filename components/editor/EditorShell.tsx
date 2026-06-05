import React from 'react';
import { MediaBin } from './MediaBin';
import { PreviewViewport } from './PreviewViewport';
import { CinematicTimeline } from './CinematicTimeline';
import { MotionBrainCanvas } from './MotionBrainCanvas';
import { cn } from '@/lib/utils';

export interface EditorShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const EditorShell: React.FC<EditorShellProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        "flex flex-row w-full h-[calc(100vh-56px)] bg-[var(--abyss)] gap-3 p-4 box-border overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Left Sidebar: Media Bin */}
      <div className="flex-none w-[320px] min-w-[320px] max-w-[400px] flex flex-col h-full overflow-hidden">
        <MediaBin />
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
      <div className="flex-none w-[380px] min-w-[380px] max-w-[480px] flex flex-col h-full overflow-hidden">
        <MotionBrainCanvas />
      </div>

      {/* Overlays / Portals */}
      {children}
    </div>
  );
};
