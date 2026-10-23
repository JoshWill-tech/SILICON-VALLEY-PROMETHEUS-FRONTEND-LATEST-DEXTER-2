import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isDevBypassActive } from '@/lib/supabase/dev-bypass'
import { normalizeSourceProfile } from '@/lib/media/source-profile'
import { mapProjectRowToListItem, type DurableJobRecord, type ProjectExportRecord } from '@/lib/projects/project-list'
import { ExportService } from '@/lib/exports/service'
import type { ProjectListItem } from '@/lib/projects/types'
import { WorkspaceService } from '@/lib/workspaces/service'
import { resolveSavedProjectSource } from '@/lib/projects/source-asset'
import type { Project, ProjectStatus, SourceProfile, AnimationPlan } from '@/lib/types'

const DEV_JEFF_SIMONS_PROJECT_ID = 'f56c53dc-d0c7-47c3-8ead-cb1c01adb49f'
const DEV_JEFF_SIMONS_SOURCE_ASSET_ID = 'jeff-simons-asset-001'

const DEV_FALLBACK_PROJECT_CARD: ProjectListItem = {
  id: DEV_JEFF_SIMONS_PROJECT_ID,
  userId: 'e261b522-9d57-4bfe-90c8-38b3720cec36',
  title: 'Jeff Simons — Thought of the Day',
  description: 'Talking head portrait mini-run source video',
  thumbnailUrl: '/media/mini-run/frame_1.8s.png',
  status: 'completed',
  progress: 100,
  createdAt: '2026-10-13T00:00:00.000Z',
  updatedAt: '2026-10-13T00:00:00.000Z',
  duration: 30,
  width: 1080,
  height: 1920,
  fps: 30,
  sourceAssetId: DEV_JEFF_SIMONS_SOURCE_ASSET_ID,
}

const DEV_FALLBACK_DB_ROW = {
  id: DEV_JEFF_SIMONS_PROJECT_ID,
  user_id: 'e261b522-9d57-4bfe-90c8-38b3720cec36',
  name: 'Jeff Simons — Thought of the Day',
  status: 'ready',
  thumbnail_url: '/media/mini-run/frame_1.8s.png',
  preview_kind: 'video',
  source_asset_id: DEV_JEFF_SIMONS_SOURCE_ASSET_ID,
  created_at: '2026-10-13T00:00:00.000Z',
  updated_at: '2026-10-13T00:00:00.000Z',
  source_profile: {
    fps: 30,
    width: 1080,
    height: 1920,
    durationSec: 30,
    aspectRatio: '9:16',
  },
  editor_state: null,
  animation_plan: null,
}

export interface ProjectPatch {
  title?: string
  status?: ProjectStatus
  thumbnailUrl?: string
  previewKind?: 'video' | 'image'
  sourceProfile?: SourceProfile | null
  editorState?: any
  animationPlan?: AnimationPlan
  sourceAssetId?: string
}

export const ProjectService = {
  async listProjectCards(): Promise<ProjectListItem[]> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      if (isDevBypassActive()) {
        return [DEV_FALLBACK_PROJECT_CARD]
      }
      throw new Error('Unauthorized')
    }

    const { data: projectRows, error: projectsError } = await supabase
      .from('projects')
      .select('id, user_id, name, status, thumbnail_url, source_asset_id, created_at, updated_at, source_profile, editor_state')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (projectsError) {
      console.error('[ProjectService] listProjectCards projects error:', projectsError.message, projectsError.details)
      if (isDevBypassActive()) {
        return [DEV_FALLBACK_PROJECT_CARD]
      }
      throw projectsError
    }

    const projectIds = (projectRows ?? []).map((row) => row.id)
    const jobsByProjectId = new Map<string, DurableJobRecord>()
    const exportsByProjectId = new Map<string, ProjectExportRecord>()

    if (projectIds.length > 0) {
      const { data: jobs, error: jobsError } = await supabase
        .from('durable_jobs')
        .select('project_id, type, status, progress, result_metadata, created_at')
        .eq('user_id', user.id)
        .in('project_id', projectIds)
        .in('type', ['render', 'export'])
        .order('created_at', { ascending: false })

      if (jobsError) {
        console.error('[ProjectService] listProjectCards durable_jobs error:', jobsError.message, jobsError.details)
      } else {
        for (const job of jobs ?? []) {
          if (!job.project_id || jobsByProjectId.has(job.project_id)) continue
          jobsByProjectId.set(job.project_id, job)
        }
      }

      try {
        const exports = await ExportService.listLatestProjectExports(projectIds)
        for (const exported of exports) {
          exportsByProjectId.set(exported.projectId, {
            project_id: exported.projectId,
            status: exported.status,
            created_at: exported.createdAt,
            storage_path: exported.storagePath,
            metadata: exported.metadata,
          })
        }
      } catch (error) {
        console.error('[ProjectService] listProjectCards exports error:', error instanceof Error ? error.message : 'Unable to load renders')
      }
    }

    return (projectRows ?? []).map((row) => mapProjectRowToListItem(row, jobsByProjectId.get(row.id) ?? null, exportsByProjectId.get(row.id) ?? null))
  },

  async listProjects() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[ProjectService] listProjects Supabase error:', error.message, error.details)
      throw error
    }
    return (data || []).map(mapProjectFromDb)
  },

  async getProject(id: string, reqOrClient?: Request | string | SupabaseClient): Promise<Project> {
    if (isDevBypassActive() && id === DEV_JEFF_SIMONS_PROJECT_ID) {
      return mapProjectFromDb(DEV_FALLBACK_DB_ROW)
    }

    const supabase = reqOrClient && typeof (reqOrClient as any).from === 'function'
      ? (reqOrClient as SupabaseClient)
      : await createClient(reqOrClient as any)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      if (isDevBypassActive()) {
        return mapProjectFromDb(DEV_FALLBACK_DB_ROW)
      }
      throw new Error('Unauthorized')
    }

    let { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!data && !error) {
      const { data: sharedData, error: sharedError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (sharedData && !sharedError) {
        data = sharedData
      }
    }

    if (!data) {
      if (isDevBypassActive() || id.startsWith('proj_')) {
        return mapProjectFromDb({
          id,
          name: 'Untitled Project',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          thumbnail_url: null,
          preview_kind: 'video',
          source_profile: null,
          source_asset_id: null,
          editor_state: {},
          animation_plan: null,
        })
      }
      if (error) {
        console.error('[ProjectService] getProject Supabase error:', error.message, error.details)
        throw error
      }
      throw new Error('Project not found')
    }

    if (!data.source_asset_id) {
      const savedSource = await resolveSavedProjectSource(supabase, {projectId: id, userId: user.id})
      if (savedSource) {
        data.source_asset_id = savedSource.id
      }
    }

    return mapProjectFromDb(data)
  },

  async createProject(params: { 
    title?: string
    description?: string | null
    template?: string | null
    prompt?: string
    previewKind?: 'video' | 'image'
    sourceProfile?: SourceProfile | null
    sourceAssetId?: string
    workspaceId?: string
  } = {}) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('[ProjectService] createProject: No authenticated user found')
        throw new Error('Unauthorized')
      }

      // Use provided workspaceId or ensure user has one
      const workspaceId = params.workspaceId || await WorkspaceService.getOrCreatePersonalWorkspace()
      
      console.log('[ProjectService] Creating project for user:', user.id, 'in workspace:', workspaceId)

      const editorState = {
        ...(params.prompt ? { initialPrompt: params.prompt } : {}),
        ...(params.description ? { projectDescription: params.description } : {}),
        ...(params.template ? { templatePreset: params.template } : {}),
      }
      const normalizedSourceProfile = normalizeSourceProfile(params.sourceProfile)

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          workspace_id: workspaceId,
          name: params.title || 'Untitled project',
          status: 'draft',
          preview_kind: params.previewKind,
          source_profile: normalizedSourceProfile ?? {},
          source_asset_id: params.sourceAssetId,
          editor_state: editorState,
        })
        .select()
        .single()

      if (error) {
        console.error('[ProjectService] createProject Supabase insert error:', error.message, '| Details:', error.details, '| Hint:', error.hint)
        throw new Error(`DB_INSERT_FAILED: ${error.message}`)
      }

      console.log('[ProjectService] Project created successfully:', data.id)
      return mapProjectFromDb(data)
    } catch (err) {
      console.error('[ProjectService] createProject fatal error:', err)
      throw err
    }
  },

  async updateProject(id: string, patch: ProjectPatch) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    const updateData: any = {}
    if (patch.title !== undefined) updateData.name = patch.title
    if (patch.status !== undefined) updateData.status = patch.status
    if (patch.thumbnailUrl !== undefined) updateData.thumbnail_url = patch.thumbnailUrl
    if (patch.previewKind !== undefined) updateData.preview_kind = patch.previewKind
    if (patch.sourceProfile !== undefined) updateData.source_profile = normalizeSourceProfile(patch.sourceProfile) ?? {}
    if (patch.editorState !== undefined) updateData.editor_state = patch.editorState
    if (patch.animationPlan !== undefined) updateData.animation_plan = patch.animationPlan
    if (patch.sourceAssetId !== undefined) updateData.source_asset_id = patch.sourceAssetId

    let { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()

    if (!data) {
      const { data: sharedUpdated, error: sharedError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .maybeSingle()
      if (sharedUpdated && !sharedError) {
        data = sharedUpdated
      }
    }

    if (!data) {
      if (error) {
        console.error('[ProjectService] updateProject Supabase error:', error.message, error.details)
        throw error
      }
      throw new Error('Project not found')
    }
    return mapProjectFromDb(data)
  },

  async deleteProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[ProjectService] deleteProject Supabase error:', error.message, error.details)
      throw error
    }
    return true
  },

  async duplicateProject(id: string): Promise<ProjectListItem> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: original, error: getError } = await supabase
      .from('projects')
      .select('id, user_id, workspace_id, name, status, thumbnail_url, preview_kind, source_profile, editor_state, animation_plan, source_asset_id, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (getError) {
      console.error('[ProjectService] duplicateProject fetch error:', getError.message, getError.details)
      throw getError
    }

    const { data: duplicate, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        workspace_id: original.workspace_id,
        name: `${original.name || 'Untitled project'} (Copy)`,
        status: 'draft',
        thumbnail_url: original.thumbnail_url,
        preview_kind: original.preview_kind,
        source_profile: original.source_profile ?? {},
        editor_state: original.editor_state ?? {},
        animation_plan: original.animation_plan ?? {},
        source_asset_id: original.source_asset_id,
      })
      .select('id, user_id, name, status, thumbnail_url, created_at, updated_at, source_profile, editor_state')
      .single()

    if (insertError) {
      console.error('[ProjectService] duplicateProject insert error:', insertError.message, insertError.details)
      throw insertError
    }

    return mapProjectRowToListItem(duplicate, null)
  }
}

function mapProjectFromDb(row: any): Project {
  return {
    id: row.id,
    title: row.name || 'Untitled project',
    status: row.status as ProjectStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    thumbnailUrl: row.thumbnail_url,
    previewKind: row.preview_kind,
    sourceProfile: normalizeSourceProfile(row.source_profile),
    sourceAssetId: row.source_asset_id,
    editorState: row.editor_state,
    animationPlan: row.animation_plan,
  }
}
