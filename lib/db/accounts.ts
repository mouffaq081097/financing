import { createClient } from '@/lib/supabase/server'
import type { Account, AccountType } from '@/types'

export async function getAccounts(): Promise<Account[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('accounts').select('*').order('created_at')
  if (error) throw error
  return data
}

export async function createAccount(input: { name: string; bank_name: string; type: AccountType }): Promise<Account> {
  const supabase = createClient()
  const { data, error } = await supabase.from('accounts').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateAccountBalance(id: string, current_balance: number): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('accounts').update({ current_balance }).eq('id', id)
  if (error) throw error
}

export async function deleteAccount(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('accounts').delete().eq('id', id)
  if (error) throw error
}
