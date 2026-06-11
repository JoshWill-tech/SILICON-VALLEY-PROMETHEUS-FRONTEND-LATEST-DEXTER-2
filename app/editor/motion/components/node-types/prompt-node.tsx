'use client'

import { Clock3, Cpu, Sigma } from 'lucide-react'

import type { MotionNode, PromptData } from '../../types/motion-editor'
import { useNodeGraph } from '../../hooks/use-node-graph'

export function PromptNode({ node }: { node: MotionNode }) {
  const data = node.data as PromptData
  const { updateNodeData } = useNodeGraph()

  return (
    <div className="space-y-3">
      <textarea
        className="min-h-[126px] w-full resize-none rounded-lg border border-transparent bg-transparent p-0 text-[12px] leading-[1.5] text-white/70 outline-none transition placeholder:text-white/25 focus:border-white/10 focus:bg-white/[0.025] focus:p-2"
        onChange={(event) => updateNodeData(node.id, { text: event.target.value })}
        value={data.text}
      />
      <div className="flex flex-wrap gap-1.5">
        <MetaPill icon={Cpu} text={data.model} />
        <MetaPill icon={Sigma} text={`${data.tokens} Tokens`} />
        <MetaPill icon={Clock3} text={`${data.duration.toFixed(1)} Sec`} />
      </div>
    </div>
  )
}

function MetaPill({
  icon: Icon,
  text,
}: {
  icon: typeof Cpu
  text: string
}) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-white/[0.055] px-2 text-[10px] font-medium text-white/50">
      <Icon className="size-3" aria-hidden />
      {text}
    </span>
  )
}
