"use client";

import { useState } from "react";

import { AnimationTrack } from "./AnimationTrack";
import { Playhead } from "./Playhead";
import { TimelineRuler } from "./TimelineRuler";
import { TranscriptStrip } from "./TranscriptStrip";

const TIMELINE_PIXELS_PER_SECOND = 10;

export function WorkspaceCanvas() {
  const [zoom, setZoom] = useState(1);
  const [playhead] = useState(0);
  const [duration] = useState(120);
  const timelineWidth = duration * TIMELINE_PIXELS_PER_SECOND * zoom;

  return (
    <div className="flex h-full flex-col bg-surface-base">
      <div className="flex h-10 items-center gap-2 border-b border-border-subtle px-4">
        <label htmlFor="workspace-zoom" className="text-xs text-text-tertiary">
          Zoom
        </label>
        <input
          id="workspace-zoom"
          aria-label="Timeline zoom"
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={zoom}
          onChange={(event) => setZoom(parseFloat(event.target.value))}
          className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-surface-floating accent-accent-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
        />
        <span className="ml-auto font-mono text-xs text-text-secondary">
          {formatTime(playhead)} / {formatTime(duration)}
        </span>
      </div>
      <div className="relative flex-1 overflow-x-auto overflow-y-hidden">
        <div
          className="relative h-full min-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          role="slider"
          tabIndex={0}
          aria-label="Timeline playhead"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={playhead}
          aria-valuetext={`${formatTime(playhead)} of ${formatTime(duration)}`}
          style={{ width: `max(100%, ${timelineWidth}px)` }}
        >
          <TimelineRuler duration={duration} zoom={zoom} />
          <Playhead position={playhead} duration={duration} zoom={zoom} />
          <div className="mt-8 space-y-2 p-4">
            <TranscriptStrip duration={duration} zoom={zoom} />
            <AnimationTrack label="Motion" color="accent-cyan" duration={duration} zoom={zoom} />
            <AnimationTrack label="Effects" color="accent-gold" duration={duration} zoom={zoom} />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
