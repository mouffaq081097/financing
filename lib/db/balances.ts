import { createAdminClient } from '@/lib/supabase/admin'
import type { Balance } from '@/types'

export async function getBalances(): Promise<Balance[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('balances')
    .select('*, accounts(*)')
    .order('recorded_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addBalanceSnapshot(input: { account_id: string; amount: number; recorded_at: string }): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('balances').insert(input)
  if (error) throw error
}

export async function getNetWorthHistory(): Promise<{ date: string; net_worth: number }[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('balances')
    .select('amount, recorded_at, accounts(type)')
    .order('recorded_at')
  if (error) throw error

  const byDate: Record<string, number> = {}
  for (const b of data) {
    const date = b.recorded_at
    const accountType = (b.accounts as any)?.type
    const sign = accountType === 'credit' ? -1 : 1
    byDate[date] = (byDate[date] ?? 0) + sign * b.amount
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, net_worth]) => ({ date, net_worth }))
}
