import { createClient } from '@/lib/supabase/server'

export const WorkspaceService = {
  async getOrCreatePersonalWorkspace() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    // Try to find an existing workspace owned by the user
    const { data: existing, error: findError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)
      .maybeSingle()

    if (findError) {
      console.error('[WorkspaceService] Error finding workspace:', findError)
      throw findError
    }

    if (existing) return existing.id

    // Create a new personal workspace if none exists
    const { data: created, error: createError } = await supabase
      .from('workspaces')
      .insert({
        name: 'Personal Workspace',
        owner_id: user.id
      })
      .select('id')
      .single()

    if (createError) {
      console.error('[WorkspaceService] Error creating personal workspace:', createError)
      throw createError
    }

    return created.id
  }
}
