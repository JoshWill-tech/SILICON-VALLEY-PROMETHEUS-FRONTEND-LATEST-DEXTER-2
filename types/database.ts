export type ProjectStatus = 'draft' | 'rendering' | 'completed' | 'failed'

export type RenderStatus = 'queued' | 'processing' | 'success' | 'failed'

export interface Workspace {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  status: ProjectStatus
  raw_video_url: string | null
  user_id: string
  source_asset_id: string | null
  created_at: string
  updated_at: string
}

export interface Render {
  id: string
  project_id: string
  status: RenderStatus
  final_video_url: string | null
  compute_time_seconds: number | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: Workspace
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
        }
      }
      projects: {
        Row: Project
        Insert: {
          id?: string
          workspace_id: string
          name: string
          status?: ProjectStatus
          raw_video_url?: string | null
          user_id?: string
          source_asset_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          status?: ProjectStatus
          raw_video_url?: string | null
          user_id?: string
          source_asset_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      renders: {
        Row: Render
        Insert: {
          id?: string
          project_id: string
          status?: RenderStatus
          final_video_url?: string | null
          compute_time_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          status?: RenderStatus
          final_video_url?: string | null
          compute_time_seconds?: number | null
          created_at?: string
        }
      }
    }
    Enums: {
      project_status: ProjectStatus
      render_status: RenderStatus
    }
  }
}
