import { createAdminClient } from '@/lib/supabase/admin'
import type { AiAdvice } from '@/types'

export async function getAdvice(month: number, year: number): Promise<AiAdvice | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('ai_advice')
    .select('*')
    .eq('month', month)
    .eq('year', year)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveAdvice(month: number, year: number, content: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('ai_advice')
    .upsert({ month, year, content, generated_at: new Date().toISOString() }, { onConflict: 'month,year' })
  if (error) throw error
}
