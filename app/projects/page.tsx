'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { 
  FileText, 
  FileVideo2, 
  Folder, 
  Loader2, 
  Search, 
  Trash2, 
  Download, 
  ExternalLink,
  Video,
  FileQuestion,
  Sparkles,
  CheckCircle2,
  Clock,
  PenSquare
} from 'lucide-react'
import { toast } from 'sonner'

import { PrometheusShell } from '@/components/prometheus-shell'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { rememberCurrentPathForEditorReturn } from '@/lib/editor-navigation'
import type { Project, ProjectStatus, ProjectExport } from '@/lib/types'
import { cn } from '@/lib/utils'

const OWNER_EMAILS = ['you@prometheus.local', 'studio@prometheus.local', 'team@prometheus.local']

type ProjectsApiResponse = {
  projects?: Project[]
  error?: string
}

type StatusFilter = 'all' | ProjectStatus

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'processing', label: 'Processing' },
  { value: 'ready', label: 'Ready' },
  { value: 'exported', label: 'Exported' },
]
const SHOULD_PREFETCH_PROJECT_EDITORS = process.env.NODE_ENV === 'production'

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds)) return 'Duration unavailable'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `Duration ${m}:${s.toString().padStart(2, '0')}`
}

function getUploadDateString(isoString: string) {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    if (diffInHours < 24) {
      return `Uploaded ${formatDistanceToNow(date, { addSuffix: true })}`
    }
    return format(date, "'Uploaded' MMM d, yyyy '·' h:mm a")
  } catch (e) {
    return 'Upload date unavailable'
  }
}

export default function ProjectsPage() {
  const router = useRouter()

  const [query, setQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')
  const [projects, setProjects] = React.useState<Project[]>([])
  const [latestExports, setLatestExports] = React.useState<Record<string, ProjectExport | null>>({})
  const [brokenPreviewIds, setBrokenPreviewIds] = React.useState<Record<string, true>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [assetToDelete, setAssetToDelete] = React.useState<{ projectId: string; assetId: string } | null>(null)
  const [projectToRemove, setProjectToRemove] = React.useState<Project | null>(null)
  const [projectToRename, setProjectToRename] = React.useState<Project | null>(null)
  const [tempRenameTitle, setTempRenameTitle] = React.useState('')
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isRemoving, setIsRemoving] = React.useState(false)
  const [isRenaming, setIsRenaming] = React.useState(false)
  const [downloadingExportId, setDownloadingExportId] = React.useState<string | null>(null)

  const handleDownload = async (exportId: string, _titleFallback?: string) => {
    setDownloadingExportId(exportId)
    try {
      const res = await fetch(`/api/exports/${exportId}/download-url`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get download link')
      }

      const downloadUrl = data.download?.url || data.downloadUrl
      const filename = data.download?.filename || _titleFallback || `export-${exportId}.mp4`

      // Trigger browser download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Download started')
    } catch (err: any) {
      console.error('[PROJECTS_DOWNLOAD]', err)
      toast.error('Could not start download', {
        description: err.message || 'An unexpected error occurred.',
      })
    } finally {
      setDownloadingExportId(null)
    }
  }

  const handleRenameProject = async () => {
    if (!projectToRename) return
    const nextTitle = tempRenameTitle.trim()
    if (!nextTitle || nextTitle === projectToRename.title) {
      setProjectToRename(null)
      return
    }

    setIsRenaming(true)
    try {
      const res = await fetch(`/api/projects/${projectToRename.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nextTitle }),
      })

      if (!res.ok) throw new Error('Failed to rename project')

      toast.success('Project renamed')
      
      // Update local state
      setProjects((prev) => 
        prev.map((p) => p.id === projectToRename.id ? { ...p, title: nextTitle } : p)
      )
      setProjectToRename(null)
    } catch (err: any) {
      console.error('[PROJECTS_RENAME]', err)
      toast.error('Could not rename project', {
        description: err.message || 'An unexpected error occurred.',
      })
    } finally {
      setIsRenaming(false)
    }
  }

  const handleRemoveProject = async () => {
    if (!projectToRemove) return

    setIsRemoving(true)
    try {
      const res = await fetch(`/api/projects/${projectToRemove.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove project')
      }

      toast.success('Project removed from workspace')
      
      // Update local state to remove the project
      setProjects((prev) => prev.filter((p) => p.id !== projectToRemove.id))
      setProjectToRemove(null)
    } catch (err: any) {
      console.error('[PROJECTS_REMOVE]', err)
      toast.error('Could not remove project', {
        description: err.message || 'An unexpected error occurred.',
      })
    } finally {
      setIsRemoving(false)
    }
  }

  const handleDeleteSourceAsset = async () => {
    if (!assetToDelete) return

    setIsDeleting(true)
    try {
      const { projectId, assetId } = assetToDelete
      const res = await fetch(`/api/assets/${assetId}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete asset')
      }

      toast.success('Source file deleted')
      
      // Update local state to clear the sourceAssetId for this project
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, sourceAssetId: undefined } : p
        )
      )
      setAssetToDelete(null)
    } catch (err: any) {
      console.error('[PROJECTS_DELETE_ASSET]', err)
      toast.error('Could not delete file', {
        description: err.message || 'An unexpected error occurred.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  React.useEffect(() => {
    const controller = new AbortController()
    let isDisposed = false

    const loadProjects = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/projects', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        })

        const payload = (await res.json().catch(() => null)) as ProjectsApiResponse | null
        if (!res.ok) {
          throw new Error(payload?.error ?? `Unable to load projects (${res.status})`)
        }

        if (isDisposed) return
        setProjects(Array.isArray(payload?.projects) ? payload.projects : [])
      } catch (err) {
        if (isDisposed || controller.signal.aborted) return
        const message = err instanceof Error ? err.message : 'Unable to load projects'
        setError(message)
        setProjects([])
      } finally {
        if (!isDisposed) setIsLoading(false)
      }
    }

    loadProjects()

    return () => {
      isDisposed = true
      controller.abort()
    }
  }, [])

  React.useEffect(() => {
    if (isLoading || projects.length === 0) return

    const fetchLatestExports = async () => {
      const results: Record<string, ProjectExport | null> = {}
      
      // We do this in parallel but with a small delay or batching if needed
      // for 200 items, parallel is fine but let's be safe.
      await Promise.all(
        projects.map(async (project) => {
          try {
            const res = await fetch(`/api/projects/${project.id}/exports/latest`)
            if (res.ok) {
              const data = await res.json()
              results[project.id] = data.export || null
            }
          } catch (err) {
            console.warn(`[PROJECTS_FETCH_EXPORT] Failed for ${project.id}`, err)
            results[project.id] = null
          }
        })
      )

      setLatestExports(results)
    }

    fetchLatestExports()
  }, [projects, isLoading])

  const { filteredProjects, counts } = React.useMemo(() => {
    const safeQuery = query.trim().toLowerCase()
    
    const allFilteredByQuery = projects.filter(p => 
      !safeQuery || p.title.toLowerCase().includes(safeQuery)
    )

    const results = allFilteredByQuery.filter((project) => {
      if (statusFilter === 'all') return true
      
      const latestExport = latestExports[project.id]
      const isProcessing = latestExport?.status === 'pending' || latestExport?.status === 'processing'
      const isExported = latestExport?.status === 'completed'
      const isReady = !!project.sourceAssetId && !isProcessing && !isExported

      if (statusFilter === 'draft') {
        return !isExported
      }
      if (statusFilter === 'processing') {
        return isProcessing
      }
      if (statusFilter === 'ready') {
        return isReady
      }
      if (statusFilter === 'exported') {
        return isExported
      }
      
      return true
    }).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))

    // Calculate counts based on the query-filtered list
    const counts = {
      all: allFilteredByQuery.length,
      draft: allFilteredByQuery.filter(p => {
        const lx = latestExports[p.id]
        return lx?.status !== 'completed'
      }).length,
      processing: allFilteredByQuery.filter(p => {
        const lx = latestExports[p.id]
        return lx?.status === 'pending' || lx?.status === 'processing'
      }).length,
      ready: allFilteredByQuery.filter(p => {
        const lx = latestExports[p.id]
        return !!p.sourceAssetId && lx?.status !== 'pending' && lx?.status !== 'processing' && lx?.status !== 'completed'
      }).length,
      exported: allFilteredByQuery.filter(p => {
        const lx = latestExports[p.id]
        return lx?.status === 'completed'
      }).length,
    }

    return { filteredProjects: results, counts }
  }, [projects, query, statusFilter, latestExports])

  React.useEffect(() => {
    if (!SHOULD_PREFETCH_PROJECT_EDITORS || isLoading) return

    for (const project of filteredProjects.slice(0, 6)) {
      void router.prefetch(`/editor/${project.id}`)
    }
  }, [filteredProjects, isLoading, router])

  const openProjectEditor = React.useCallback(
    (projectId: string) => {
      rememberCurrentPathForEditorReturn()
      router.push(`/editor/${projectId}`)
    },
    [router],
  )

  const isEmpty = !isLoading && filteredProjects.length === 0
  const isDataEmpty = !isLoading && projects.length === 0

  return (
    <>
      <PrometheusShell>
      <div className="h-full px-3 py-3 md:px-4 md:py-4">
        <div className="mx-auto h-full max-w-[1500px] overflow-hidden rounded-[30px] border border-white/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.03)_30%,rgba(7,7,12,0.76)_100%)] shadow-[0_48px_120px_-64px_rgba(0,0,0,0.94),inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-3xl">
          <section className="h-full min-h-[calc(100vh-124px)] bg-[radial-gradient(130%_90%_at_80%_0%,rgba(183,123,255,0.18)_0%,rgba(92,70,140,0.08)_34%,rgba(0,0,0,0)_66%)] px-4 py-5 md:px-6">
            <div className="border-b border-white/12 pb-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-lg font-medium text-white/94">Project Folders</div>
                  <div className="mt-1 text-xs text-white/56">
                    Manage your projects and edit history.
                  </div>
                </div>

                <div className="relative w-full max-w-[390px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search projects"
                    className="h-10 rounded-xl border-white/16 bg-white/[0.06] pl-9 text-sm text-white/90 placeholder:text-white/42"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {STATUS_FILTERS.map((filter) => {
                  const count = counts[filter.value as keyof typeof counts] ?? 0
                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setStatusFilter(filter.value)}
                      className={cn(
                        'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        statusFilter === filter.value
                          ? 'border-white/28 bg-white/[0.14] text-white'
                          : 'border-white/14 bg-white/[0.03] text-white/62 hover:border-white/24 hover:text-white'
                      )}
                    >
                      {filter.label}
                      <span className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px]",
                        statusFilter === filter.value ? "bg-white/20 text-white" : "bg-white/5 text-white/40"
                      )}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-rose-300/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <div className="pt-5">
              <h2 className="text-3xl font-semibold tracking-tight text-white/95">Folders</h2>
              {isLoading ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`loading-${index}`}
                      className="h-[210px] animate-pulse rounded-[22px] border border-white/10 bg-white/[0.04]"
                    />
                  ))}
                </div>
              ) : isEmpty ? (
                <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-16 text-center text-white/62">
                  <div className="flex size-16 items-center justify-center rounded-full bg-white/5 mb-4">
                    <Search className="size-8 text-white/20" />
                  </div>
                  <div className="text-lg font-medium text-white/80">
                    {isDataEmpty 
                      ? 'No projects found' 
                      : statusFilter === 'processing' 
                        ? 'No exports are processing right now'
                        : statusFilter === 'ready'
                          ? 'No projects are ready for export yet'
                          : statusFilter === 'exported'
                            ? 'No completed exports yet'
                            : 'No projects match this filter'}
                  </div>
                  <p className="mt-2 max-w-[300px] text-sm text-white/40">
                    {isDataEmpty 
                      ? 'Create your first project in the Studio to get started.' 
                      : 'Try adjusting your search query or switching filters.'}
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProjects.map((project) => {
                    const latestExport = latestExports[project.id]
                    const hasCompletedExport = latestExport?.status === 'completed' && !!latestExport?.storagePath

                    return (
                      <div
                        key={project.id}
                        className="group relative flex flex-col rounded-[22px] border border-white/15 bg-[linear-gradient(152deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_30%,rgba(7,7,11,0.78)_100%)] p-3 shadow-[0_28px_54px_-34px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/26"
                      >
                        {project.sourceAssetId ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setAssetToDelete({ projectId: project.id, assetId: project.sourceAssetId! })
                            }}
                            className="absolute right-5 top-7 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/0 backdrop-blur-md transition-all group-hover:text-white/40 hover:border-rose-500/40 hover:bg-rose-900/40 hover:!text-rose-400"
                            title="Delete source file from storage"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setProjectToRemove(project)
                            }}
                            className="absolute right-5 top-7 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/0 backdrop-blur-md transition-all group-hover:text-white/40 hover:border-white/30 hover:bg-white/10 hover:!text-white/90"
                            title="Remove project folder"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}

                        <div className="relative h-[132px] w-full cursor-pointer" onClick={() => openProjectEditor(project.id)}>
                          <div className="absolute left-5 top-0 h-7 w-24 rounded-t-[12px] border border-white/20 border-b-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.08)_100%)]" />
                          <div className="absolute inset-x-0 bottom-0 top-5 overflow-hidden rounded-2xl border border-white/16 bg-[linear-gradient(168deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.03)_72%)]">
                            {project.thumbnailUrl && !brokenPreviewIds[project.id] ? (
                              project.previewKind === 'video' ? (
                                <video
                                  src={project.thumbnailUrl}
                                  muted
                                  loop
                                  autoPlay
                                  playsInline
                                  preload="metadata"
                                  className="h-full w-full object-cover opacity-[0.85] transition-transform duration-300 group-hover:scale-[1.04]"
                                  onError={() =>
                                    setBrokenPreviewIds((prev) => ({
                                      ...prev,
                                      [project.id]: true,
                                    }))
                                  }
                                />
                              ) : (
                                <img
                                  src={project.thumbnailUrl}
                                  alt={project.title}
                                  className="h-full w-full object-cover opacity-[0.85] transition-transform duration-300 group-hover:scale-[1.04]"
                                  onError={() =>
                                    setBrokenPreviewIds((prev) => ({
                                      ...prev,
                                      [project.id]: true,
                                    }))
                                  }
                                />
                              )
                            ) : (
                              <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0)_52%),linear-gradient(165deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.02)_68%)]">
                                <Folder className="size-11 text-white/74" />
                              </div>
                            )}
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(0,0,0,0)_28%,rgba(0,0,0,0.38)_100%)]" />
                          </div>
                        </div>

                        <div className="flex-1 pt-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-lg text-white/94" title={project.title}>{project.title}</div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setTempRenameTitle(project.title)
                                setProjectToRename(project)
                              }}
                              className="shrink-0 rounded-md p-1 text-white/20 transition-colors hover:bg-white/5 hover:text-white/60"
                              title="Rename project"
                            >
                              <PenSquare className="size-3.5" />
                            </button>
                          </div>
                          
                          <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-white/40">
                            <span className="flex items-center gap-1.5">
                              <Clock className="size-3 shrink-0" /> {getUploadDateString(project.createdAt)}
                            </span>
                            {project.sourceProfile?.inspection?.durationSec != null && (
                              <span className="flex items-center gap-1.5">
                                <FileVideo2 className="size-3 shrink-0" /> {formatDuration(project.sourceProfile.inspection.durationSec)}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {project.sourceAssetId ? (
                              <Badge variant="secondary" className="border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-400">
                                <Video className="mr-1 size-2.5" /> Source Attached
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-400">
                                <FileQuestion className="mr-1 size-2.5" /> Missing Source
                              </Badge>
                            )}

                            {hasCompletedExport && (
                              <Badge variant="secondary" className="border-violet-500/20 bg-violet-500/10 text-[10px] text-violet-400">
                                <CheckCircle2 className="mr-1 size-2.5" /> Export Ready
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 rounded-lg border-white/10 bg-white/5 text-[11px] font-medium text-white/80 hover:bg-white/10 hover:text-white"
                            onClick={() => openProjectEditor(project.id)}
                          >
                            <ExternalLink className="mr-1.5 size-3" />
                            Open Editor
                          </Button>

                          {hasCompletedExport ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={downloadingExportId === latestExport.id}
                              className="h-8 rounded-lg border-violet-500/30 bg-violet-500/10 text-[11px] font-medium text-violet-200 hover:bg-violet-500/20"
                              onClick={() => handleDownload(latestExport.id, `${project.title}.mp4`)}
                            >
                              {downloadingExportId === latestExport.id ? (
                                <Loader2 className="mr-1.5 size-3 animate-spin" />
                              ) : (
                                <Download className="mr-1.5 size-3" />
                              )}
                              Download
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 rounded-lg border-white/5 bg-white/[0.03] text-[11px] font-medium text-white/40 hover:bg-white/[0.08] hover:text-white"
                              onClick={() => openProjectEditor(project.id)}
                            >
                              <Sparkles className="mr-1.5 size-3" />
                              {project.sourceAssetId ? 'Export' : 'Upload'}
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="pt-7">
              <h3 className="text-3xl font-semibold tracking-tight text-white/95">Recently Updated</h3>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-white/12 bg-[linear-gradient(160deg,rgba(255,255,255,0.08)_0%,rgba(8,8,12,0.8)_100%)] backdrop-blur-xl">
                <div className="min-w-[640px]">
                  <div className="grid grid-cols-[minmax(0,1.35fr)_140px_160px_160px_80px] border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.12em] text-white/44">
                    <div>Project</div>
                    <div>Source</div>
                    <div>Status</div>
                    <div>Next Action</div>
                    <div className="text-right">Action</div>
                  </div>
                  {filteredProjects.slice(0, 8).map((project) => {
                    const latestExport = latestExports[project.id]
                    const hasCompletedExport = latestExport?.status === 'completed' && !!latestExport?.storagePath

                    return (
                      <div
                        key={`${project.id}-row`}
                        className="grid w-full grid-cols-[minmax(0,1.35fr)_140px_160px_160px_80px] items-center px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
                      >
                        <button
                          type="button"
                          onClick={() => openProjectEditor(project.id)}
                          className="flex min-w-0 items-center gap-3 text-white/86 transition-colors hover:text-white"
                        >
                          {project.previewKind === 'video' ? (
                            <FileVideo2 className="size-5 shrink-0 text-violet-200/90" />
                          ) : (
                            <FileText className="size-5 shrink-0 text-white/70" />
                          )}
                          <div className="flex flex-col items-start min-w-0">
                            <span className="truncate text-[13px] font-medium">{project.title}</span>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-white/40">
                              <span className="flex items-center gap-1"><Clock className="size-2.5" /> {getUploadDateString(project.createdAt)}</span>
                              {project.sourceProfile?.inspection?.durationSec != null && (
                                <span className="flex items-center gap-1"><FileVideo2 className="size-2.5" /> {formatDuration(project.sourceProfile.inspection.durationSec)}</span>
                              )}
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-2">
                          {project.sourceAssetId ? (
                            <Badge variant="outline" className="h-5 border-emerald-500/20 bg-emerald-500/5 px-1.5 text-[9px] font-medium text-emerald-400">
                              Attached
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="h-5 border-amber-500/20 bg-amber-500/5 px-1.5 text-[9px] font-medium text-amber-400">
                              Missing
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-white/58">
                          {hasCompletedExport ? (
                            <span className="flex items-center gap-1.5 text-violet-300">
                              <CheckCircle2 className="size-3" />
                              Export Ready
                            </span>
                          ) : project.status === 'processing' ? (
                            <span className="flex items-center gap-1.5 text-amber-300">
                              <Loader2 className="size-3 animate-spin" />
                              Processing
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Clock className="size-3" />
                              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-medium text-white/70">
                          {hasCompletedExport ? (
                            <button 
                              onClick={() => handleDownload(latestExport.id, `${project.title}.mp4`)}
                              disabled={downloadingExportId === latestExport.id}
                              className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300"
                            >
                              {downloadingExportId === latestExport.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Download className="size-3" />
                              )}
                              Download MP4
                            </button>
                          ) : !project.sourceAssetId ? (
                            <button 
                              onClick={() => openProjectEditor(project.id)}
                              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300"
                            >
                              <Sparkles className="size-3" />
                              Upload Media
                            </button>
                          ) : (
                            <button 
                              onClick={() => openProjectEditor(project.id)}
                              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                            >
                              <ExternalLink className="size-3" />
                              Open Editor
                            </button>
                          )}
                        </div>

                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTempRenameTitle(project.title)
                              setProjectToRename(project)
                            }}
                            className="group flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/40 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white/90"
                            title="Rename project"
                          >
                            <PenSquare className="size-3.5 transition-transform group-hover:scale-110" />
                          </button>

                          {project.sourceAssetId ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setAssetToDelete({ projectId: project.id, assetId: project.sourceAssetId! })
                              }}
                              className="group flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/40 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
                              title="Delete source file from storage"
                            >
                              <Trash2 className="size-3.5 transition-transform group-hover:scale-110" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setProjectToRemove(project)
                              }}
                              className="group flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/40 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white/90"
                              title="Remove project folder"
                            >
                              <Trash2 className="size-3.5 transition-transform group-hover:scale-110" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {!isLoading && filteredProjects.length === 0 ? (
                    <div className="px-4 py-8 text-sm text-white/56">No uploaded files yet.</div>
                  ) : null}
                </div>
              </div>
              {filteredProjects.length > 0 ? (
                <div className="mt-2 text-xs text-white/45">
                  Last update: {formatDistanceToNow(new Date(filteredProjects[0]!.updatedAt), { addSuffix: true })}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </PrometheusShell>

    <Dialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(null)}>
      <DialogContent className="border-white/10 bg-[#0a0a0d] text-white">
        <DialogHeader>
          <DialogTitle>Delete source file?</DialogTitle>
          <DialogDescription className="text-white/60">
            This removes the uploaded source file from storage. The project will remain, but its source media will be missing.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => setAssetToDelete(null)}
            disabled={isDeleting}
            className="text-white/70 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteSourceAsset}
            disabled={isDeleting}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete File'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!projectToRemove} onOpenChange={(open) => !open && setProjectToRemove(null)}>
      <DialogContent className="border-white/10 bg-[#0a0a0d] text-white">
        <DialogHeader>
          <DialogTitle>Remove this project?</DialogTitle>
          <DialogDescription className="text-white/60">
            This project has no source media attached. Removing it will clear it from your workspace. This action cannot be undone.
            {latestExports[projectToRemove?.id || ''] && (
              <span className="mt-2 block text-amber-300/80">
                Note: Linked export records will also be removed.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => setProjectToRemove(null)}
            disabled={isRemoving}
            className="text-white/70 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemoveProject}
            disabled={isRemoving}
            className="bg-white text-black hover:bg-white/90"
          >
            {isRemoving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              'Remove Project'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!projectToRename} onOpenChange={(open) => !open && setProjectToRename(null)}>
      <DialogContent className="border-white/10 bg-[#0a0a0d] text-white">
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
          <DialogDescription className="text-white/60">
            Enter a new display name for this project.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={tempRenameTitle}
            onChange={(e) => setTempRenameTitle(e.target.value)}
            placeholder="New project title"
            className="border-white/10 bg-white/5 text-white"
            onKeyDown={(e) => e.key === 'Enter' && handleRenameProject()}
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => setProjectToRename(null)}
            disabled={isRenaming}
            className="text-white/70 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRenameProject}
            disabled={isRenaming}
            className="bg-white text-black hover:bg-white/90"
          >
            {isRenaming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Renaming...
              </>
            ) : (
              'Save name'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
