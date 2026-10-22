"use client"

import { motion, useReducedMotion } from "framer-motion"
import { ThinkingOrb } from "thinking-orbs"
import { BotAvatar } from "bot-avatars"
import { CinematicSkeletalLoader } from "@/components/loading-animation"

import { cn } from "@/lib/utils"

export interface PrometheusChatLoadingSkeletonProps {
  label?: string
  sublabel?: string
  prompt?: string | null
  intent?: string | null
  thoughts?: string[] | null
  className?: string
  showCinematicVideo?: boolean
  showBotAvatar?: boolean
}

export function PrometheusChatLoadingSkeleton({
  label = "Jarvis is preparing a response...",
  sublabel = "Preparing your Prometheus response...",
  prompt,
  intent,
  thoughts,
  className,
  showCinematicVideo = false,
  showBotAvatar = true,
}: PrometheusChatLoadingSkeletonProps) {
  const reduceMotion = useReducedMotion()

  if (showCinematicVideo) {
    return (
      <div className={cn("w-full py-1", className)}>
        <CinematicSkeletalLoader
          variant="chat"
          label={label}
          sublabel={sublabel}
          prompt={prompt}
          intent={intent}
          thoughts={thoughts}
        />
      </div>
    )
  }

  if (showBotAvatar) {
    return (
      <div
        role="status"
        aria-label={label}
        data-chat-thinking-indicator="true"
        className={cn("flex w-full min-w-0 items-center gap-2.5", className)}
      >
        <motion.span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center"
          animate={reduceMotion
            ? { y: [0, -1, 0] }
            : { y: [0, -2, 0], rotate: [0, -2, 0, 2, 0], scale: [1, 1.025, 1] }}
          transition={{ duration: reduceMotion ? 2 : 1.35, repeat: Infinity, ease: "easeInOut" }}
        >
          <BotAvatar
            type="clover"
            face="mouth"
            state="working"
            size={40}
            speed={1.2}
            jumpEvery={3}
            jumpHeight={14}
          />
        </motion.span>
        <div className="inline-flex min-h-10 min-w-0 items-center gap-2 rounded-[18px] rounded-bl-[6px] border border-white/[0.08] bg-white/[0.045] px-3 py-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-xs font-medium text-white/78">{label}</span>
            {sublabel ? <span className="truncate text-[11px] text-white/42">{sublabel}</span> : null}
          </div>
          <span aria-hidden="true" className="ml-0.5 flex shrink-0 items-center gap-1">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="size-1.5 rounded-full bg-[#9ff6e3]/75"
                animate={reduceMotion ? undefined : { opacity: [0.35, 1, 0.35], y: [0, -2.5, 0] }}
                transition={{ duration: 0.72, delay: index * 0.14, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={cn("flex w-full min-w-0 items-center gap-3", className)}
    >
      <span aria-hidden="true" className="relative grid size-8 shrink-0 place-items-center">
        <ThinkingOrb
          data-thinking-orb="breathing"
          state="breathing"
          size={20}
          theme="dark"
          paused={reduceMotion ? true : undefined}
        />
      </span>
      <div aria-hidden="true" className="flex min-w-0 flex-1 flex-col gap-1.5 py-1">
        <SkeletonLine className="w-full max-w-48" reduceMotion={reduceMotion} />
        <SkeletonLine className="w-[82%] max-w-40" reduceMotion={reduceMotion} delay={0.12} />
        <SkeletonLine className="w-[58%] max-w-28" reduceMotion={reduceMotion} delay={0.24} />
      </div>
    </div>
  )
}

function SkeletonLine({
  className,
  reduceMotion,
  delay = 0,
}: {
  className: string
  reduceMotion: boolean | null
  delay?: number
}) {
  return (
    <motion.span
      data-skeleton-flow="true"
      className={cn(
        "relative block h-1.5 overflow-hidden rounded-full bg-white/10",
        className,
      )}
      animate={reduceMotion ? undefined : { opacity: [0.52, 0.9, 0.52], scaleX: [0.98, 1, 0.98] }}
      transition={{ duration: 1.55, delay, ease: "easeInOut", repeat: Infinity }}
    >
      <motion.span
        className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.72),transparent)]"
        initial={false}
        animate={reduceMotion ? { x: "55%" } : { x: ["-120%", "240%"] }}
        transition={{ duration: 1.35, delay, ease: [0.4, 0, 0.2, 1], repeat: Infinity }}
      />
    </motion.span>
  )
}
