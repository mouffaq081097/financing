import { createClient } from '@/lib/supabase/server'
import type { Income, IncomeSource } from '@/types'

export async function getIncome(filters?: { month?: number; year?: number }): Promise<Income[]> {
  const supabase = createClient()
  let query = supabase.from('income').select('*, accounts(*)').order('date', { ascending: false })

  if (filters?.month && filters?.year) {
    const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`
    const end = new Date(filters.year, filters.month, 0).toISOString().split('T')[0]
    query = query.gte('date', start).lte('date', end)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function addIncome(input: {
  account_id: string; amount: number; source: IncomeSource; description?: string; date: string
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('income').insert(input)
  if (error) throw error
}
