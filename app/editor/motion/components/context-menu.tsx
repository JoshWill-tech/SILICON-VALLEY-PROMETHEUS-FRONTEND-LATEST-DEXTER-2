'use client'

import { Copy, FilePlus2, Maximize2, RotateCcw, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { useNodeGraph } from '../hooks/use-node-graph'
import type { NodeType } from '../types/motion-editor'

export function MotionContextMenu() {
  const {
    addNode,
    contextMenu,
    duplicateNode,
    pasteNodes,
    removeEdge,
    removeNode,
    setCanvasTransform,
    setContextMenu,
  } = useNodeGraph()

  if (!contextMenu) return null

  const close = () => setContextMenu(null)

  return (
    <div
      className="fixed z-[80] min-w-[178px] overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] py-1 text-[13px] text-white shadow-[0_8px_32px_rgba(0,0,0,0.55)]"
      onContextMenu={(event) => event.preventDefault()}
      style={{ left: contextMenu.screen.x, top: contextMenu.screen.y }}
    >
      {contextMenu.type === 'canvas' ? (
        <>
          <MenuSubhead>Add Node</MenuSubhead>
          {canvasNodeTypes.map((item) => (
            <MenuItem
              icon={FilePlus2}
              key={item.type}
              label={item.label}
              onClick={() => {
                addNode(item.type, contextMenu.canvas)
                close()
              }}
            />
          ))}
          <MenuItem icon={Copy} label="Paste" onClick={() => { pasteNodes(contextMenu.canvas); close() }} />
          <MenuItem icon={Maximize2} label="Zoom to Fit" onClick={() => { setCanvasTransform({ x: 44, y: 34 }, 0.88); close() }} />
          <MenuItem icon={RotateCcw} label="Reset View" onClick={() => { setCanvasTransform({ x: 44, y: 34 }, 1); close() }} />
        </>
      ) : null}

      {contextMenu.type === 'node' ? (
        <>
          <MenuItem icon={Copy} label="Duplicate" onClick={() => { duplicateNode(contextMenu.nodeId); close() }} />
          <MenuItem icon={FilePlus2} label="Copy" onClick={close} />
          <MenuItem icon={RotateCcw} label="Rename" onClick={close} />
          <MenuItem icon={Trash2} label="Delete" tone="danger" onClick={() => { removeNode(contextMenu.nodeId); close() }} />
        </>
      ) : null}

      {contextMenu.type === 'edge' ? (
        <MenuItem icon={Trash2} label="Delete" tone="danger" onClick={() => { removeEdge(contextMenu.edgeId); close() }} />
      ) : null}
    </div>
  )
}

const canvasNodeTypes: Array<{ label: string; type: NodeType }> = [
  { label: 'AI Configuration', type: 'ai-config' },
  { label: 'Prompt', type: 'prompt' },
  { label: 'Image Settings', type: 'image-settings' },
  { label: 'Final Results', type: 'final-results' },
  { label: 'Code', type: 'code' },
]

function MenuSubhead({ children }: { children: ReactNode }) {
  return <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-white/35">{children}</div>
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  tone = 'default',
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  tone?: 'default' | 'danger'
}) {
  return (
    <button
      className={tone === 'danger'
        ? 'flex w-full items-center gap-2 px-3 py-2 text-left text-red-200 transition hover:bg-white/[0.08]'
        : 'flex w-full items-center gap-2 px-3 py-2 text-left text-white transition hover:bg-white/[0.08]'}
      onClick={onClick}
      type="button"
    >
      <Icon className="size-4 text-white/45" aria-hidden />
      {label}
    </button>
  )
}
