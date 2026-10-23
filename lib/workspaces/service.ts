import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

async function resolveWorkspaceClient(reqOrClient?: Request | string | SupabaseClient): Promise<SupabaseClient> {
  if (reqOrClient && typeof reqOrClient === 'object' && 'from' in reqOrClient && 'auth' in reqOrClient) {
    return reqOrClient as SupabaseClient
  }
  if (reqOrClient && typeof reqOrClient === 'object' && 'headers' in reqOrClient) {
    return createClient(reqOrClient as Request)
  }
  if (typeof reqOrClient === 'string' && reqOrClient.trim()) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser(reqOrClient.trim())
    if (user) {
      return {
        ...supabase,
        auth: {
          ...supabase.auth,
          getUser: async (token?: string) => {
            if (!token || token === reqOrClient) return { data: { user }, error: null }
            return supabase.auth.getUser(token)
          },
        },
      } as unknown as SupabaseClient
    }
  }
  return createClient()
}

export const WorkspaceService = {
  async getOrCreatePersonalWorkspace(reqOrClient?: Request | string | SupabaseClient) {
    const supabase = await resolveWorkspaceClient(reqOrClient)
    let { data: { user } } = await supabase.auth.getUser()
    if (!user && reqOrClient && typeof reqOrClient === 'object' && 'headers' in reqOrClient) {
      const authHeader = (reqOrClient as Request).headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim()
        const { data: headerUser } = await supabase.auth.getUser(token)
        if (headerUser?.user) user = headerUser.user
      }
    }
    
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
