import { createClient } from '@/lib/supabase/server'
import type { Statement, ParseStatus } from '@/types'

export async function getStatements(): Promise<Statement[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('statements')
    .select('*, accounts(*)')
    .order('year', { ascending: false })
  if (error) throw error
  return data
}

export async function createStatement(input: {
  account_id: string; month: number; year: number; file_url: string
}): Promise<Statement> {
  const supabase = createClient()
  const { data, error } = await supabase.from('statements').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateStatementStatus(id: string, parse_status: ParseStatus): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('statements').update({ parse_status }).eq('id', id)
  if (error) throw error
}
