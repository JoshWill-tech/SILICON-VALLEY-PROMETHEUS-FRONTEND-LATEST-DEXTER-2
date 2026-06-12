'use client'

import { ChevronDown } from 'lucide-react'

import type { AiConfigData, MotionNode } from '../../types/motion-editor'
import { useNodeGraph } from '../../hooks/use-node-graph'

export function AiConfigNode({ node }: { node: MotionNode }) {
  const data = node.data as AiConfigData
  const { updateNodeData } = useNodeGraph()

  return (
    <div className="space-y-4">
      <NodeSelect
        label="Core Model"
        value={data.coreModel}
        values={['Claude 4', 'GPT-5', 'Gemini Ultra']}
        onChange={(coreModel) => updateNodeData(node.id, { coreModel })}
      />
      <NodeSelect
        label="Inference Mode"
        value={data.inferenceMode}
        values={['High Quality', 'Realtime', 'Draft']}
        onChange={(inferenceMode) => updateNodeData(node.id, { inferenceMode })}
      />
    </div>
  )
}

function NodeSelect({
  label,
  onChange,
  value,
  values,
}: {
  label: string
  onChange: (value: string) => void
  value: string
  values: string[]
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-normal text-white/40">{label}</span>
      <span className="relative block">
        <select
          className="h-10 w-full appearance-none rounded-lg border border-white/10 bg-white/[0.065] px-3 pr-9 text-[13px] font-normal text-white outline-none transition focus:border-[#22c55e]/70"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {values.map((option) => (
            <option className="bg-[#111]" key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/45" aria-hidden />
      </span>
    </label>
  )
}
