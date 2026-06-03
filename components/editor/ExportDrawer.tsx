'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Music2, Instagram, Youtube, Twitter, FolderOpen, Check, ChevronLeft, Loader2, Wand2, X, Plus } from 'lucide-react'
import { useEditor } from './EditorContext'
import { useUploadManager } from '@/hooks/useUploadManager'

type ExportStep = 'select-target' | 'select-account' | 'configure-caption' | 'select-folder' | 'complete'

interface ExportTarget {
  id: string
  type: 'local' | 'social' | 'cloud'
  name: string
  icon: React.RefNode
  color: string
}

const TARGETS: ExportTarget[] = [
  { id: 'download', type: 'local', name: 'Download MP4', icon: <Download size={20} />, color: '#00f0ff' },
  { id: 'tiktok', type: 'social', name: 'TikTok', icon: <Music2 size={20} />, color: '#ff0050' },
  { id: 'instagram', type: 'social', name: 'Instagram', icon: <Instagram size={20} />, color: '#e4405f' },
  { id: 'youtube', type: 'social', name: 'YouTube', icon: <Youtube size={20} />, color: '#ff0000' },
  { id: 'x', type: 'social', name: 'X / Twitter', icon: <Twitter size={20} />, color: '#ffffff' },
  { id: 'gdrive', type: 'cloud', name: 'Google Drive', icon: <FolderOpen size={20} />, color: '#4285f4' },
  { id: 'dropbox', type: 'cloud', name: 'Dropbox', icon: <FolderOpen size={20} />, color: '#0061ff' },
]

const MOCK_ACCOUNTS = [
  { id: 'acc-1', platform: 'tiktok', username: '@creator', connected: true },
  { id: 'acc-2', platform: 'instagram', username: '@visuals', connected: true },
  { id: 'acc-3', platform: 'youtube', username: 'Studio', connected: false },
]

const MOCK_FOLDERS = [
  { id: 'root', name: 'My Drive', path: '/' },
  { id: 'videos', name: 'Videos', path: '/Videos' },
  { id: 'prometheus', name: 'Prometheus Exports', path: '/Videos/Prometheus' },
]

const CAPTIONS = [
  'The future of content creation is here. 🚀 #AI #Future',
  'Made by AI. Perfected by Prometheus. ✨',
  'This changes everything. Watch till the end. 👀',
]

export const ExportDrawer: React.FC = () => {
  const { showExport, setShowExport } = useEditor()
  const { addTask } = useUploadManager()
  const [step, setStep] = useState<ExportStep>('select-target')
  const [selectedTarget, setSelectedTarget] = useState<ExportTarget | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<(typeof MOCK_ACCOUNTS)[0] | null>(null)
  const [caption, setCaption] = useState(CAPTIONS[0])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<(typeof MOCK_FOLDERS)[0] | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)

  const handleClose = () => {
    setShowExport(false)
    setTimeout(() => {
      setStep('select-target')
      setSelectedTarget(null)
      setSelectedAccount(null)
      setSelectedFolder(null)
      setShowNewFolderInput(false)
    }, 300)
  }

  const handleSelectTarget = (target: ExportTarget) => {
    setSelectedTarget(target)
    if (target.type === 'local') {
      addTask('video_export.mp4', 'Local Download')
      setStep('complete')
    } else if (target.type === 'social') {
      setStep('select-account')
    } else {
      setStep('select-folder')
    }
  }

  const handleRegenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setCaption(CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)])
      setIsGenerating(false)
    }, 1000)
  }

  const handlePost = () => {
    addTask('video_export.mp4', selectedAccount?.platform || 'social')
    setStep('complete')
  }

  const handleSaveCloud = () => {
    const folder = selectedFolder || MOCK_FOLDERS[0]
    addTask('video_export.mp4', `${selectedTarget?.name} — ${folder.name}`)
    setStep('complete')
  }

  return (
    <AnimatePresence>
      {showExport && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md mx-4 mb-4 rounded-2xl bg-[#0c0c10]/90 backdrop-blur-[32px] border border-white/[0.08] shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="flex justify-end p-3">
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={16} className="text-white/40" />
              </button>
            </div>
            <div className="px-5 pb-6">
              {step === 'select-target' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white/90">Export Video</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {TARGETS.map((target) => (
                      <button
                        key={target.id}
                        onClick={() => handleSelectTarget(target)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] active:scale-95 transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${target.color}15`, color: target.color }}>
                          {target.icon}
                        </div>
                        <span className="text-xs font-medium text-white/80">{target.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 'select-account' && (
                <div className="space-y-4">
                  <button onClick={() => setStep('select-target')} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 mb-1">
                    <ChevronLeft size={14} /> Back
                  </button>
                  <h3 className="text-lg font-semibold text-white/90">Select Account</h3>
                  <div className="space-y-2">
                    {MOCK_ACCOUNTS.filter((a) => a.connected).map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => { setSelectedAccount(acc); setStep('configure-caption') }}
                        className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3 hover:bg-white/[0.06] transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <Music2 size={18} className="text-white/60" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white/80">{acc.username}</div>
                          <div className="text-xs text-white/40 capitalize">{acc.platform}</div>
                        </div>
                        <Check size={16} className="text-emerald-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 'configure-caption' && (
                <div className="space-y-4">
                  <button onClick={() => setStep('select-account')} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 mb-1">
                    <ChevronLeft size={14} /> Back
                  </button>
                  <h3 className="text-lg font-semibold text-white/90">Review & Post</h3>
                  <div className="aspect-video rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/[0.06] flex items-center justify-center">
                    <span className="text-xs text-white/30">Video Preview</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-white/60">Caption</label>
                      <button onClick={handleRegenerate} disabled={isGenerating} className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                        {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} Regenerate
                      </button>
                    </div>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full h-20 bg-white/5 rounded-xl p-3 text-sm text-white placeholder:text-white/30 border border-white/[0.06] focus:border-cyan-500/40 focus:outline-none resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handlePost} className="flex-1 py-2.5 rounded-lg bg-cyan-500 text-black text-sm font-medium hover:bg-cyan-400 transition-colors">Post</button>
                  </div>
                </div>
              )}

              {step === 'select-folder' && (
                <div className="space-y-4">
                  <button onClick={() => setStep('select-target')} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 mb-1">
                    <ChevronLeft size={14} /> Back
                  </button>
                  <h3 className="text-lg font-semibold text-white/90">Save to {selectedTarget?.name}</h3>
                  <div className="space-y-1">
                    {MOCK_FOLDERS.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder)}
                        className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-colors ${selectedFolder?.id === folder.id ? 'bg-white/10 border border-cyan-500/30' : 'bg-white/[0.03] border border-white/[0.06]'}`}
                      >
                        <FolderOpen size={16} className="text-cyan-400/60" />
                        <span className="text-sm text-white/80">{folder.name}</span>
                        {selectedFolder?.id === folder.id && <Check size={14} className="text-cyan-400 ml-auto" />}
                      </button>
                    ))}
                    <button onClick={() => setShowNewFolderInput(true)} className="w-full p-3 rounded-xl border border-dashed border-white/[0.08] flex items-center gap-3 text-left hover:bg-white/[0.03]">
                      <Plus size={16} className="text-white/40" /> <span className="text-sm text-white/60">Create New Folder</span>
                    </button>
                  </div>
                  {showNewFolderInput && (
                    <div className="flex gap-2">
                      <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder name" className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm border border-white/[0.06] text-white outline-none" autoFocus />
                      <button onClick={() => { if (newFolderName) { setSelectedFolder({ id: 'custom', name: newFolderName, path: `/${newFolderName}` }); setShowNewFolderInput(false); } }} className="px-3 py-2 rounded-lg bg-cyan-500/15 text-cyan-400 text-sm hover:bg-cyan-500/25">Create</button>
                    </div>
                  )}
                  <button onClick={handleSaveCloud} disabled={!selectedFolder && !newFolderName} className="w-full py-2.5 rounded-lg bg-cyan-500 text-black text-sm font-medium disabled:opacity-40">Save Here</button>
                </div>
              )}

              {step === 'complete' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.15)]">
                    <Check size={32} className="text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white/90">Export Started</h3>
                    <p className="text-sm text-white/40 mt-1">Track progress in the top-right corner</p>
                  </div>
                  <button onClick={handleClose} className="px-6 py-2 rounded-lg bg-white/10 text-sm hover:bg-white/20 transition-colors">Done</button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
