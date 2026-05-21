'use client'

import React from 'react'
import { Project } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecentEditsPickerProps {
  projects: Project[]
  selectedProjectId?: string
  onSelect: (project: Project) => void
}

export function RecentEditsPicker({ projects, selectedProjectId, onSelect }: RecentEditsPickerProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className={cn(
              "relative overflow-hidden cursor-pointer group border-white/5 bg-white/5 backdrop-blur-sm transition-all duration-300",
              selectedProjectId === project.id ? "ring-2 ring-lime-400 border-lime-400/50" : "hover:bg-white/10"
            )}
            onClick={() => onSelect(project)}
          >
            <div className="aspect-video relative bg-zinc-900">
              {project.thumbnailUrl ? (
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs italic">
                  No Thumbnail
                </div>
              )}
              
              {selectedProjectId === project.id && (
                <div className="absolute top-2 right-2 z-10">
                  <CheckCircle2 className="w-5 h-5 text-lime-400 fill-zinc-900" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
            </div>
            
            <div className="p-3">
              <h4 className="text-sm font-medium text-white truncate">{project.title}</h4>
              <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider">
                {new Date(project.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
