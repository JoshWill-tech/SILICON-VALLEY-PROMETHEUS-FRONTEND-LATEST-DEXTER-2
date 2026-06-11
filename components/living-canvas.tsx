'use client'

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AudioWaveform,
  ChevronDown,
  Droplets,
  Film,
  Scissors,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ProcessingJob } from "@/lib/types";
import { useDeviceTier } from "@/hooks/useDeviceTier";

type NodeKind = "source" | "grade" | "cut" | "transition" | "audio" | "prompt";

type CanvasNode = {
  id: string;
  parentId?: string;
  title: string;
  prompt: string;
  kind: NodeKind;
  startMs: number;
  endMs: number;
  x: number;
  y: number;
  fromPipeline?: boolean;
};

type CanvasEdge = {
  id: string;
  from: CanvasNode;
  to: CanvasNode;
  path: string;
};

type ViewportState = {
  x: number;
  y: number;
  scale: number;
};

type Ripple = {
  id: string;
  x: number;
  y: number;
};

export interface LivingCanvasProps {
  projectId: string;
  job: ProcessingJob;
  className?: string;
}

const BLOCK_WIDTH = 320;
const BLOCK_HEIGHT = 208;
const CHRONO_WIDTH = 280;
const CHRONO_HEIGHT = 140;

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function inferKindFromPrompt(prompt: string): NodeKind {
  const p = prompt.toLowerCase();
  if (p.includes("color") || p.includes("tone") || p.includes("grade")) return "grade";
  if (p.includes("cut") || p.includes("trim") || p.includes("pace")) return "cut";
  if (p.includes("transition")) return "transition";
  if (p.includes("audio") || p.includes("sound") || p.includes("voice") || p.includes("music")) return "audio";
  return "prompt";
}

function buildSeedNodes(job: ProcessingJob): CanvasNode[] {
  const sourcePrompt = job?.input.prompt?.trim() || "Initial upload prepared for cinematic refinement.";
  const scenes = job?.artifacts.scenes ?? [];
  const totalDuration = scenes.length > 0 ? scenes[scenes.length - 1]!.endMs : 66000;

  const root: CanvasNode = {
    id: "root",
    kind: "source",
    title: "Source Ingest",
    prompt: sourcePrompt,
    startMs: 0,
    endMs: Math.max(4000, Math.round(totalDuration * 0.12)),
    x: 220,
    y: 560,
    fromPipeline: true,
  };

  const steps = job?.steps ?? [
    { key: "video-analysis", title: "Video Analysis" },
    { key: "scene-detection", title: "Scene Detection" },
    { key: "audio-processing", title: "Audio Processing" },
    { key: "ai-enhancement", title: "AI Enhancement" },
  ];

  const pipelineNodes = steps.map((step, i) => {
    const startMs = Math.round((i / (steps.length + 1)) * totalDuration);
    const endMs = Math.round(((i + 1.15) / (steps.length + 1)) * totalDuration);

    const yOffsets = [-120, -20, 90, -70, 65, -40];
    const kind =
      step.key === "audio-processing"
        ? "audio"
        : step.key === "scene-detection"
          ? "cut"
          : step.key === "ai-enhancement"
            ? "grade"
            : "prompt";

    const prompt =
      step.key === "video-analysis"
        ? "Analyze motion and identify key pacing inflection points."
        : step.key === "scene-detection"
          ? "Tighten cuts and improve rhythm around the strongest beats."
          : step.key === "audio-processing"
            ? "Balance voice, shape music bed, and remove harsh frequencies."
            : "Enhance cinematic polish with nuanced contrast and depth.";

    return {
      id: `pipeline_${i + 1}`,
      parentId: i === 0 ? root.id : `pipeline_${i}`,
      kind: kind as NodeKind,
      title: step.title,
      prompt,
      startMs,
      endMs,
      x: 640 + i * 450,
      y: 540 + yOffsets[i % yOffsets.length]!,
      fromPipeline: true,
    };
  });

  return [root, ...pipelineNodes];
}

function buildEdge(from: CanvasNode, to: CanvasNode): CanvasEdge {
  const sx = from.x + BLOCK_WIDTH;
  const sy = from.y + BLOCK_HEIGHT / 2;
  const ex = to.x;
  const ey = to.y + BLOCK_HEIGHT / 2;
  const curvature = Math.max(130, Math.abs(ex - sx) * 0.42);
  const c1x = sx + curvature;
  const c1y = sy;
  const c2x = ex - curvature;
  const c2y = ey;
  return {
    id: `${from.id}->${to.id}`,
    from,
    to,
    path: `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`,
  };
}

export function LivingCanvas({ projectId, job, className }: LivingCanvasProps) {
  const surfaceRef = React.useRef<HTMLDivElement>(null);
  const tier = useDeviceTier();
  const isLowTier = tier === 'low';

  const [surfaceSize, setSurfaceSize] = React.useState({ width: 0, height: 0 });
  const [viewport, setViewport] = React.useState<ViewportState>({ x: 120, y: -20, scale: 0.8 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [nodes, setNodes] = React.useState<CanvasNode[]>(() => buildSeedNodes(job));
  const [hoveredNodeId, setHoveredNodeId] = React.useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = React.useState<string | null>(null);
  const [recentNodeId, setRecentNodeId] = React.useState<string | null>(null);
  const [refineNodeId, setRefineNodeId] = React.useState<string | null>(null);
  const [refineDraft, setRefineDraft] = React.useState("");
  const [refiningNodeId, setRefiningNodeId] = React.useState<string | null>(null);
  const [commandPrompt, setCommandPrompt] = React.useState("");
  const [ripples, setRipples] = React.useState<Ripple[]>([]);
  const panRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>(null);

  React.useEffect(() => {
    setNodes(buildSeedNodes(job));
    setHoveredNodeId(null);
    setFocusedNodeId(null);
    setRecentNodeId(null);
    setRefineNodeId(null);
    setCommandPrompt("");
  }, [projectId, job?.id]);

  React.useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const read = () => setSurfaceSize({ width: el.clientWidth, height: el.clientHeight });
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const edges = React.useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    return nodes
      .filter((n) => n.parentId)
      .map((node) => {
        const parent = byId.get(node.parentId!);
        if (!parent) return null;
        return buildEdge(parent, node);
      })
      .filter(Boolean) as CanvasEdge[];
  }, [nodes]);

  const totalDurationMs = React.useMemo(() => {
    const nodeMax = nodes.reduce((max, n) => Math.max(max, n.endMs), 0);
    const sceneMax = job?.artifacts.scenes.length
      ? job.artifacts.scenes[job.artifacts.scenes.length - 1]!.endMs
      : 0;
    return Math.max(nodeMax, sceneMax, 60_000);
  }, [job, nodes]);

  const hoveredNode = React.useMemo(
    () => nodes.find((node) => node.id === hoveredNodeId) ?? null,
    [hoveredNodeId, nodes]
  );

  const chronoPosition = React.useMemo(() => {
    if (!hoveredNode || surfaceSize.width === 0) return null;
    const centerX = viewport.x + (hoveredNode.x + BLOCK_WIDTH / 2) * viewport.scale;
    const y = viewport.y + (hoveredNode.y - CHRONO_HEIGHT - 14) * viewport.scale;
    const left = clamp(centerX - CHRONO_WIDTH / 2, 12, Math.max(12, surfaceSize.width - CHRONO_WIDTH - 12));
    const top = clamp(y, 12, Math.max(12, surfaceSize.height - CHRONO_HEIGHT - 12));
    return { left, top };
  }, [hoveredNode, surfaceSize.height, surfaceSize.width, viewport.scale, viewport.x, viewport.y]);

  const triggerRipple = React.useCallback((x: number, y: number) => {
    const id = uid("ripple");
    setRipples((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 1200);
  }, []);

  const suggestNodePlacement = React.useCallback(
    (parent: CanvasNode | null) => {
      if (!parent) {
        return {
          x: 280 + nodes.length * 340,
          y: 560 + ((nodes.length % 2 === 0 ? -1 : 1) * 86),
        };
      }
      const siblingCount = nodes.filter((n) => n.parentId === parent.id).length;
      const yOffsets = [-160, -48, 72, 148, -210, 230];
      return {
        x: parent.x + 450,
        y: parent.y + yOffsets[siblingCount % yOffsets.length]!,
      };
    },
    [nodes]
  );

  const spawnNode = React.useCallback(
    (params: { parentId?: string; title: string; prompt: string; kind: NodeKind; startMs: number; endMs: number }) => {
      const parent = params.parentId ? nodes.find((n) => n.id === params.parentId) ?? null : null;
      const position = suggestNodePlacement(parent);
      const id = uid("node");
      const nextNode: CanvasNode = {
        id,
        parentId: params.parentId,
        title: params.title,
        prompt: params.prompt,
        kind: params.kind,
        startMs: params.startMs,
        endMs: params.endMs,
        x: position.x,
        y: position.y,
      };
      setNodes((prev) => [...prev, nextNode]);
      setRecentNodeId(id);
      setFocusedNodeId(id);
      setHoveredNodeId(id);
      triggerRipple(position.x + BLOCK_WIDTH / 2, position.y + BLOCK_HEIGHT / 2);
    },
    [nodes, suggestNodePlacement, triggerRipple]
  );

  const onHandlePointerUp = (e: React.PointerEvent) => {
    if (panRef.current && panRef.current.pointerId === e.pointerId) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      panRef.current = null;
      setIsPanning(false);
    }
  };

  const onHandlePointerCancel = onHandlePointerUp;

  if (isLowTier) {
    return (
      <div className={cn("relative flex h-full min-h-[560px] w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#07070a]", className)}>
        <div className="flex h-full items-center justify-center p-12 text-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-widest text-white/40">
              Low Power Mode Active
            </div>
            <h3 className="text-lg font-bold text-white">Lobe Pipeline Visualizer</h3>
            <p className="text-sm text-white/50 max-w-xs mx-auto">
              Dynamic animations disabled to preserve performance on this device.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative flex h-full min-h-[560px] w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/70", className)}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_8%,rgba(185,142,255,0.14)_0%,transparent_34%),radial-gradient(circle_at_84%_14%,rgba(112,73,195,0.12)_0%,transparent_42%),linear-gradient(180deg,rgba(7,7,10,0.94)_0%,rgba(4,4,6,0.98)_100%)]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.26) 0.8px, rgba(255,255,255,0) 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <motion.div
          className="absolute inset-0 opacity-16"
          animate={{ backgroundPositionX: ["0%", "40%", "0%"] }}
          transition={{ duration: 28, ease: "linear", repeat: Infinity }}
          style={{
            backgroundImage:
              "repeating-radial-gradient(ellipse at 50% 120%, rgba(110,78,198,0.33) 0px, rgba(110,78,198,0.33) 1px, transparent 2px, transparent 34px)",
            backgroundSize: "100% 260px",
            maskImage: "linear-gradient(to top, transparent 4%, black 16%, black 84%, transparent 100%)",
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/8 bg-black/20 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white/55">
            Living Canvas
          </span>
          <span className="text-[11px] text-white/42">Drag to pan, wheel to zoom, hover to refine.</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const width = surfaceRef.current?.clientWidth ?? 0;
              const height = surfaceRef.current?.clientHeight ?? 0;
              setViewport({ scale: 0.76, x: width * 0.03, y: height * 0.14 });
            }}
            className="h-7 rounded-full border-white/15 bg-transparent px-3 text-[11px] text-white/75 hover:bg-white/[0.08] hover:text-white"
          >
            Fit View
          </Button>
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/60">
            Zoom {Math.round(viewport.scale * 100)}%
          </div>
        </div>
      </div>

      <div
        ref={surfaceRef}
        className={cn("relative flex-1 overflow-hidden", isPanning ? "cursor-grabbing" : "cursor-grab")}
        onWheel={(e) => {
          e.preventDefault();
          const rect = surfaceRef.current?.getBoundingClientRect();
          if (!rect) return;
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          const delta = e.deltaY > 0 ? 0.92 : 1.08;
          setViewport((prev) => {
            const nextScale = clamp(prev.scale * delta, 0.5, 1.8);
            const worldX = (mouseX - prev.x) / prev.scale;
            const worldY = (mouseY - prev.y) / prev.scale;
            return {
              scale: nextScale,
              x: mouseX - worldX * nextScale,
              y: mouseY - worldY * nextScale,
            };
          });
        }}
        onPointerDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("[data-node='true']") || target.closest("[data-chrono='true']")) return;
          (panRef as any).current = {
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            originX: viewport.x,
            originY: viewport.y,
          };
          setIsPanning(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!panRef.current || panRef.current.pointerId !== e.pointerId) return;
          const dx = e.clientX - panRef.current.startX;
          const dy = e.clientY - panRef.current.startY;
          setViewport((prev) => ({
            ...prev,
            x: panRef.current!.originX + dx,
            y: panRef.current!.originY + dy,
          }));
        }}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerCancel}
      >
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Edges */}
          <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
            {edges.map((edge) => {
              const hot = hoveredNodeId === edge.from.id || hoveredNodeId === edge.to.id;
              return (
                <g key={edge.id}>
                  <path d={edge.path} fill="none" stroke="white" strokeWidth="3" strokeOpacity="0.03" />
                  <motion.path
                    d={edge.path}
                    fill="none"
                    stroke={hot ? "rgba(0, 240, 255, 0.5)" : "rgba(255, 255, 255, 0.1)"}
                    strokeWidth="1.5"
                    strokeDasharray="6 6"
                    animate={{ strokeDashoffset: [0, -190], opacity: hot ? [0.35, 0.85, 0.35] : [0.2, 0.55, 0.2] }}
                    transition={{ duration: 12, ease: "linear", repeat: Infinity }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const isRoot = node.id === "root";
            const isFocused = focusedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const isRecent = recentNodeId === node.id;
            const Icon =
              node.kind === "source"
                ? Film
                : node.kind === "grade"
                  ? Droplets
                  : node.kind === "cut"
                    ? Scissors
                    : node.kind === "transition"
                      ? WandSparkles
                      : node.kind === "audio"
                        ? AudioWaveform
                        : Sparkles;

            return (
              <motion.div
                key={node.id}
                data-node="true"
                layoutId={node.id}
                initial={isRecent ? { scale: 0.8, opacity: 0 } : false}
                animate={{
                  scale: isFocused ? 1.02 : isHovered ? 1.01 : 1,
                  opacity: 1,
                }}
                className={cn(
                  "absolute flex flex-col overflow-hidden rounded-[26px] border bg-[#111115]/90 shadow-2xl transition-colors duration-300",
                  isFocused ? "border-accent-cyan/60 bg-[#16161c]" : "border-white/10 hover:border-white/20"
                )}
                style={{
                  width: BLOCK_WIDTH,
                  height: BLOCK_HEIGHT,
                  left: node.x,
                  top: node.y,
                  zIndex: isFocused ? 30 : isHovered ? 20 : 10,
                }}
                onPointerEnter={() => setHoveredNodeId(node.id)}
                onPointerLeave={() => setHoveredNodeId(null)}
                onClick={() => {
                  setFocusedNodeId(node.id);
                  setRecentNodeId(null);
                }}
              >
                <div className="flex h-12 items-center justify-between border-b border-white/5 bg-white/[0.02] px-5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-lg border",
                        isFocused
                          ? "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan"
                          : "border-white/10 bg-white/5 text-white/40"
                      )}
                    >
                      <Icon size={13} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                      {node.title}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-white/25">{formatDuration(node.startMs)}</div>
                </div>

                <div className="flex-1 p-5">
                  <p className="line-clamp-3 text-sm leading-relaxed text-white/60">{node.prompt}</p>
                </div>

                <div className="flex h-10 items-center justify-between bg-black/40 px-5">
                  <div className="flex items-center gap-4">
                    <button
                      className="text-[10px] font-semibold uppercase tracking-widest text-accent-cyan/60 hover:text-accent-cyan transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRefineNodeId(node.id);
                        setRefineDraft(node.prompt);
                      }}
                    >
                      Refine
                    </button>
                    {!isRoot && (
                      <button
                        className="text-[10px] font-semibold uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNodes((prev) => prev.filter((n) => n.id !== node.id));
                          if (focusedNodeId === node.id) setFocusedNodeId(null);
                        }}
                      >
                        Rip
                      </button>
                    )}
                  </div>
                  <div className="flex -space-x-1.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="size-5 rounded-full border border-void bg-white/5 shadow-sm ring-1 ring-white/5"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Ripples */}
          <AnimatePresence>
            {ripples.map((r) => (
              <motion.div
                key={r.id}
                initial={{ width: 0, height: 0, opacity: 0.5, x: 0, y: 0 }}
                animate={{ width: 220, height: 220, opacity: 0, x: -110, y: -110 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="pointer-events-none absolute rounded-full border border-accent-cyan/30 bg-accent-cyan/5"
                style={{ left: r.x, top: r.y, zIndex: 5 }}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Chrono Tooltip (Contextual) */}
        <AnimatePresence>
          {chronoPosition && (
            <motion.div
              data-chrono="true"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute z-50 rounded-2xl border border-white/10 bg-[#0c0c10]/95 p-4 shadow-2xl backdrop-blur-xl"
              style={{
                width: CHRONO_WIDTH,
                height: CHRONO_HEIGHT,
                left: chronoPosition.left,
                top: chronoPosition.top,
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Node Influence</span>
                <span className="text-[10px] font-mono text-accent-cyan">{(viewport.scale * 100).toFixed(0)}%</span>
              </div>
              <div className="space-y-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full bg-accent-cyan"
                    initial={{ width: 0 }}
                    animate={{ width: "70%" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white/5 p-2 text-center">
                    <div className="text-[9px] uppercase tracking-tighter text-white/20">Entropy</div>
                    <div className="text-xs font-bold text-white/70">Low</div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2 text-center">
                    <div className="text-[9px] uppercase tracking-tighter text-white/20">Bias</div>
                    <div className="text-xs font-bold text-white/70">0.82</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Command Center */}
        <div className="absolute bottom-10 left-1/2 z-40 -translate-x-1/2">
          <motion.form
            onSubmit={(e) => {
               e.preventDefault();
               const prompt = commandPrompt.trim();
               if (!prompt) return;
           
               const parent = focusedNodeId ? nodes.find((n) => n.id === focusedNodeId) : nodes[nodes.length - 1];
               const startMs = parent?.endMs ?? 0;
               const endMs = startMs + 10_000;
               const kind = inferKindFromPrompt(prompt);
               const title =
                 kind === "grade"
                   ? "Cinematic Color Grade"
                   : kind === "cut"
                     ? "Rhythm Cut Pass"
                     : kind === "audio"
                       ? "Audio Sculpt"
                       : kind === "transition"
                         ? "Transition Weave"
                         : "Prompt Refinement";
           
               spawnNode({
                 parentId: parent?.id,
                 title,
                 prompt,
                 kind,
                 startMs,
                 endMs,
               });
               setCommandPrompt("");
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-3 rounded-full border border-white/10 bg-black/60 p-2 pr-4 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-accent-cyan/10 text-accent-cyan shadow-inner">
              <Sparkles size={18} />
            </div>
            <Input
              value={commandPrompt}
              onChange={(e) => setCommandPrompt(e.target.value)}
              placeholder="Inject new node into pipeline..."
              className="h-10 w-80 border-0 bg-transparent text-sm text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <button
              type="submit"
              className="rounded-full bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            >
              Push
            </button>
          </motion.form>
        </div>
      </div>

      {/* Refinement Modal */}
      <AnimatePresence>
        {refineNodeId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#0c0c10] p-8 shadow-2xl"
            >
              <h2 className="mb-6 text-xl font-bold text-white">Refine Node Instruction</h2>
              <textarea
                className="mb-6 h-40 w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white outline-none focus:border-accent-cyan/30"
                value={refineDraft}
                onChange={(e) => setRefineDraft(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setRefineNodeId(null)} className="text-white/40 hover:text-white">
                  Cancel
                </Button>
                <Button
                  className="rounded-full bg-accent-cyan px-8 font-bold text-void hover:bg-accent-cyan/80"
                  onClick={() => {
                    const targetId = refineNodeId;
                    const nextPrompt = refineDraft.trim();
                    if (!targetId || !nextPrompt) return;
                
                    const targetNode = nodes.find((node) => node.id === targetId);
                    if (!targetNode) return;
                
                    setNodes((prev) => prev.map((n) => (n.id === targetId ? { ...n, prompt: nextPrompt, kind: inferKindFromPrompt(nextPrompt) } : n)));
                    setRefineNodeId(null);
                    triggerRipple(targetNode.x + BLOCK_WIDTH / 2, targetNode.y + BLOCK_HEIGHT / 2);
                  }}
                >
                  Apply Refinement
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
