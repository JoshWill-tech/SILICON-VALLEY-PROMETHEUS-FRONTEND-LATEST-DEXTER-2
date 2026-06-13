import { createClient } from '@supabase/supabase-js'

export async function checkCredits(userId: string, cost: number): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration for credit checks.')
  }

  const supabase = createClient(url, serviceRoleKey)
  const { data, error } = await supabase
    .from('dodo_credits')
    .select('total_remaining')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data?.total_remaining || 0) >= cost
}

export async function deductCredits(userId: string, cost: number): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration for credit deduction.')
  }

  const supabase = createClient(url, serviceRoleKey)
  const { error } = await supabase.rpc('deduct_credits', { p_user_id: userId, p_cost: cost })
  if (error) throw error
}
