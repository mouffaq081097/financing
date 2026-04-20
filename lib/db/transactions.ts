import { createAdminClient } from '@/lib/supabase/admin'
import type { Transaction } from '@/types'

export async function getTransactions(filters?: {
  month?: number
  year?: number
  account_id?: string
  category_id?: string
}): Promise<Transaction[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('transactions')
    .select('*, categories(*), accounts(*)')
    .order('date', { ascending: false })

  if (filters?.account_id) query = query.eq('account_id', filters.account_id)
  if (filters?.category_id) query = query.eq('category_id', filters.category_id)
  if (filters?.month && filters?.year) {
    const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`
    const end = new Date(filters.year, filters.month, 0).toISOString().split('T')[0]
    query = query.gte('date', start).lte('date', end)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function updateTransactionCategory(id: string, category_id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('transactions').update({ category_id }).eq('id', id)
  if (error) throw error
}

export async function bulkInsertTransactions(rows: Omit<Transaction, 'id' | 'created_at' | 'categories' | 'accounts'>[]): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('transactions').insert(rows)
  if (error) throw error
}

export async function getMonthlySummary(year: number): Promise<{ month: number; credit_total: number; debit_total: number }[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('date, amount, type, source')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
  if (error) throw error

  const byMonth: Record<number, { credit_total: number; debit_total: number }> = {}
  for (let m = 1; m <= 12; m++) byMonth[m] = { credit_total: 0, debit_total: 0 }

  for (const t of data) {
    const month = parseInt(t.date.split('-')[1])
    if (t.source === 'credit_card' || t.source === 'debit_card') {
      if (t.type === 'debit') byMonth[month].debit_total += Math.abs(t.amount)
      else byMonth[month].credit_total += Math.abs(t.amount)
    }
  }

  return Object.entries(byMonth).map(([month, totals]) => ({ month: parseInt(month), ...totals }))
}

export async function getCategoryTotals(month: number, year: number): Promise<{ category_id: string; total: number; category_name: string; color: string }[]> {
  const supabase = createAdminClient()
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, category_id, categories(name, color)')
    .gte('date', start)
    .lte('date', end)
    .eq('type', 'debit')
  if (error) throw error

  const totals: Record<string, { total: number; category_name: string; color: string }> = {}
  for (const t of data) {
    const cid = t.category_id ?? 'uncategorized'
    const name = (t.categories as any)?.name ?? 'Other'
    const color = (t.categories as any)?.color ?? '#9ca3af'
    if (!totals[cid]) totals[cid] = { total: 0, category_name: name, color }
    totals[cid].total += Math.abs(t.amount)
  }

  return Object.entries(totals).map(([category_id, v]) => ({ category_id, ...v }))
}
