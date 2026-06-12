'use client'

import type { CSSProperties } from 'react'

import type { ImageSettingsData, MotionNode } from '../../types/motion-editor'
import { useNodeGraph } from '../../hooks/use-node-graph'

export function ImageSettingsNode({ node }: { node: MotionNode }) {
  const data = node.data as ImageSettingsData
  const { updateNodeData } = useNodeGraph()

  return (
    <div className="space-y-5">
      <NodeSlider
        label="Creativity Level"
        left="Low"
        onChange={(creativityLevel) => updateNodeData(node.id, { creativityLevel })}
        right="High"
        sublabel="Mode"
        value={data.creativityLevel}
      />
      <NodeSlider
        label="Quality Steps"
        left="0"
        onChange={(qualitySteps) => updateNodeData(node.id, { qualitySteps })}
        right="100"
        sublabel={`${data.qualitySteps}`}
        value={data.qualitySteps}
      />
    </div>
  )
}

function NodeSlider({
  label,
  left,
  onChange,
  right,
  sublabel,
  value,
}: {
  label: string
  left: string
  onChange: (value: number) => void
  right: string
  sublabel: string
  value: number
}) {
  return (
    <label className="block">
      <span className="mb-3 flex items-center justify-between">
        <span>
          <span className="block text-[12px] font-medium text-white/78">{label}</span>
          <span className="block text-[11px] text-white/35">{sublabel}</span>
        </span>
      </span>
      <input
        className="motion-node-range w-full"
        max={100}
        min={0}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ '--range-fill': `${value}%` } as CSSProperties}
        type="range"
        value={value}
      />
      <span className="mt-1 flex justify-between text-[10px] font-medium text-white/35">
        <span>{left}</span>
        <span>{right}</span>
      </span>
    </label>
  )
}
