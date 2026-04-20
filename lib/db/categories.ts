import { createAdminClient } from '@/lib/supabase/admin'
import type { Category } from '@/types'

export async function getCategories(): Promise<Category[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data
}

export async function updateCategory(id: string, input: Partial<Pick<Category, 'name' | 'color' | 'icon'>>): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('categories').update(input).eq('id', id)
  if (error) throw error
}
