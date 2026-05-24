import { createClient } from '@/lib/supabase/server'
import { WorkspaceService } from '@/lib/workspaces/service'
import type { Project, ProjectStatus, SourceProfile, AnimationPlan } from '@/lib/types'

export interface ProjectPatch {
  title?: string
  status?: ProjectStatus
  thumbnailUrl?: string
  previewKind?: 'video' | 'image'
  sourceProfile?: SourceProfile
  editorState?: any
  animationPlan?: AnimationPlan
  sourceAssetId?: string
}

export const ProjectService = {
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

  async getProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('[ProjectService] getProject Supabase error:', error.message, error.details)
      throw error
    }
    return mapProjectFromDb(data)
  },

  async createProject(params: { 
    title?: string
    previewKind?: 'video' | 'image'
    sourceProfile?: SourceProfile
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

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          workspace_id: workspaceId,
          name: params.title || 'Untitled project',
          status: 'draft',
          preview_kind: params.previewKind,
          source_profile: params.sourceProfile || {},
          source_asset_id: params.sourceAssetId,
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
    if (patch.sourceProfile !== undefined) updateData.source_profile = patch.sourceProfile
    if (patch.editorState !== undefined) updateData.editor_state = patch.editorState
    if (patch.animationPlan !== undefined) updateData.animation_plan = patch.animationPlan
    if (patch.sourceAssetId !== undefined) updateData.source_asset_id = patch.sourceAssetId

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[ProjectService] updateProject Supabase error:', error.message, error.details)
      throw error
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
    sourceProfile: row.source_profile,
    sourceAssetId: row.source_asset_id,
    editorState: row.editor_state,
    animationPlan: row.animation_plan,
  }
}
