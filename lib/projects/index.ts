import {
  Project,
  ProcessingJob,
  ProcessingJobInput,
  ProjectStatus,
  TranscriptSegment,
  DetectedScene,
  HighlightTimestamp,
  BRollSuggestion,
  PipelineStep
} from '../types'
import { readLocalStorageJSON, writeLocalStorageJSON } from '../storage'
import { ProjectManager, ProjectCreateParams } from './interface'

const STORAGE = {
  projects: 'prometheus.projects.v1',
  jobsByProjectId: 'prometheus.jobsByProjectId.v1',
  activeStyleId: 'prometheus.activeStyleId.v1',
} as const

const STEP_DURATIONS_MS: Record<PipelineStep['key'], number> = {
  'video-analysis': 2600,
  'scene-detection': 2400,
  'audio-processing': 2200,
  'ai-enhancement': 2800,
}

export const PROJECTS_UPDATED_EVENT = 'prometheus:projects-updated'

export class MockProjectManager implements ProjectManager {
  private _projectsCache: Project[] | null = null
  private _jobsCache: Record<string, ProcessingJob> | null = null

  private dispatchUpdate() {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent(PROJECTS_UPDATED_EVENT))
  }

  create(params: ProjectCreateParams): Project {
    const project: Project = {
      id: this.uid('proj'),
      title: params.title ?? 'Untitled Project',
      status: 'draft',
      createdAt: this.nowIso(),
      updatedAt: this.nowIso(),
      thumbnailUrl: params.thumbnailUrl ?? '',
      previewKind: params.previewKind,
      sourceAssetId: params.sourceAssetId,
    }
    this.upsertProject(project)
    this.dispatchUpdate()
    return project
  }

  get(id: string): Project | null {
    const projects = this.list()
    const project = projects.find((p) => p.id === id) ?? null
    if (!project) return null

    // Compute derived status if processing
    if (project.status === 'processing') {
      const job = this.getJob(id)
      if (job && job.status === 'completed') {
        const updatedProject: Project = { ...project, status: 'ready', updatedAt: this.nowIso() }
        this.upsertProject(updatedProject)
        this.dispatchUpdate()
        return updatedProject
      }
    }

    return project
  }

  list(): Project[] {
    if (this._projectsCache) return this._projectsCache

    const raw = readLocalStorageJSON<Project[]>(STORAGE.projects)
    const projects = Array.isArray(raw) ? raw : []
    this._projectsCache = [...projects].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    return this._projectsCache
  }

  update(id: string, updates: Partial<Project>): Project | null {
    const projects = this.list()
    const index = projects.findIndex((p) => p.id === id)
    if (index < 0) return null

    const project = projects[index]!
    const next: Project = {
      ...project,
      ...updates,
      updatedAt: this.nowIso(),
    }

    const nextList = [next, ...projects.filter((p) => p.id !== id)]
    this._projectsCache = nextList.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    writeLocalStorageJSON(STORAGE.projects, this._projectsCache)

    this.dispatchUpdate()
    return next
  }

  process(id: string, input: ProcessingJobInput): ProcessingJob | null {
    const project = this.get(id)
    if (!project) return null

    const job = this.createMockJob(id, input)
    const jobs = this.readJobs()
    jobs[id] = job
    this.writeJobs(jobs)

    this.update(id, { status: 'processing' })
    return job
  }

  getJob(projectId: string): ProcessingJob | null {
    const jobs = this.readJobs()
    const job = jobs[projectId]
    if (!job) return null

    // Deterministic simulation logic
    const startedAtMs = Date.parse(job.startedAt)
    const elapsedMs = Math.max(0, Date.now() - startedAtMs)

    let cursor = 0
    let anyChanged = false
    const updatedSteps = job.steps.map((step) => {
      const d = STEP_DURATIONS_MS[step.key]
      const stepStart = cursor
      const stepEnd = cursor + d
      cursor = stepEnd

      let nextStatus = step.status
      let nextProgress = step.progress

      if (elapsedMs < stepStart) {
        nextStatus = 'pending'
        nextProgress = 0
      } else if (elapsedMs >= stepEnd) {
        nextStatus = 'completed'
        nextProgress = 1
      } else {
        nextStatus = 'running'
        nextProgress = this.clamp01((elapsedMs - stepStart) / d)
      }

      if (nextStatus !== step.status || nextProgress !== step.progress) {
        anyChanged = true
      }

      return { ...step, status: nextStatus as any, progress: nextProgress }
    })

    const allDone = updatedSteps.every((s) => s.status === 'completed')
    const nextStatus = allDone ? 'completed' : 'running'

    if (anyChanged || job.status !== nextStatus) {
      const next: ProcessingJob = { ...job, steps: updatedSteps, status: nextStatus as any }
      jobs[projectId] = next
      this.writeJobs(jobs)
      return next
    }

    return job
  }

  reset(): void {
    this._projectsCache = []
    this._jobsCache = {}
    writeLocalStorageJSON(STORAGE.projects, [])
    writeLocalStorageJSON(STORAGE.jobsByProjectId, {})
    writeLocalStorageJSON(STORAGE.activeStyleId, '')
    this.dispatchUpdate()
  }

  getActiveStyleId(): string | null {
    return readLocalStorageJSON<string>(STORAGE.activeStyleId)
  }

  setActiveStyleId(styleId: string | null): void {
    if (!styleId) {
      writeLocalStorageJSON(STORAGE.activeStyleId, '')
    } else {
      writeLocalStorageJSON(STORAGE.activeStyleId, styleId)
    }
    this.dispatchUpdate()
  }

  setAnimationPlan(projectId: string, plan: any): void {
    const jobs = this.readJobs()
    const job = jobs[projectId]
    if (!job) return

    const next: ProcessingJob = {
      ...job,
      artifacts: {
        ...job.artifacts,
        animationPlan: plan,
      },
    }

    jobs[projectId] = next
    this.writeJobs(jobs)
    this.dispatchUpdate()
  }

  // --- PRIVATE HELPERS ---

  private uid(prefix: string) {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
  }

  private nowIso() {
    return new Date().toISOString()
  }

  private clamp01(n: number) {
    return Math.max(0, Math.min(1, n))
  }

  private upsertProject(project: Project): void {
    const current = this.list()
    const next = [project, ...current.filter((p) => p.id !== project.id)]
    this._projectsCache = next.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    writeLocalStorageJSON(STORAGE.projects, this._projectsCache)
  }

  private readJobs(): Record<string, ProcessingJob> {
    if (this._jobsCache) return this._jobsCache
    this._jobsCache = readLocalStorageJSON<Record<string, ProcessingJob>>(STORAGE.jobsByProjectId) ?? {}
    return this._jobsCache
  }

  private writeJobs(value: Record<string, ProcessingJob>) {
    this._jobsCache = value
    writeLocalStorageJSON(STORAGE.jobsByProjectId, value)
  }

  private createMockJob(projectId: string, input: ProcessingJobInput): ProcessingJob {
    const startedAt = this.nowIso()
    return {
      id: this.uid('job'),
      projectId,
      status: 'running',
      createdAt: this.nowIso(),
      startedAt,
      steps: [
        { key: 'video-analysis', title: 'Video Analysis', status: 'running', progress: 0 },
        { key: 'scene-detection', title: 'Scene Detection', status: 'pending', progress: 0 },
        { key: 'audio-processing', title: 'Audio Processing', status: 'pending', progress: 0 },
        { key: 'ai-enhancement', title: 'AI Enhancement', status: 'pending', progress: 0 },
      ],
      input,
      artifacts: {
        ...this.buildMockArtifacts(projectId),
        styleId: input.styleId,
      },
    }
  }

  private buildMockArtifacts(seedKey: string) {
    const transcript: TranscriptSegment[] = Array.from({ length: 9 }).map((_, i) => ({
      id: this.uid('ts'),
      startMs: i * 9000,
      endMs: i * 9000 + 7500,
      speaker: i % 2 === 0 ? 'Host' : 'Guest',
      text: "Mock text segment content.",
    }))

    return {
      transcript,
      scenes: [] as DetectedScene[],
      highlights: [] as HighlightTimestamp[],
      brollSuggestions: [] as BRollSuggestion[]
    }
  }
}

// Singleton export for easy use across the app
export const projects = new MockProjectManager()
