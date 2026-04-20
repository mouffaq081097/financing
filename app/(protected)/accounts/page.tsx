'use client'
import { useEffect, useState } from 'react'
import type { Account, AccountType } from '@/types'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', bank_name: '', type: 'debit' as AccountType })
  const [balanceInput, setBalanceInput] = useState<Record<string, string>>({})

  async function load() {
    const res = await fetch('/api/accounts')
    setAccounts(await res.json())
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowForm(false)
    setForm({ name: '', bank_name: '', type: 'debit' })
    load()
  }

  async function handleUpdateBalance(id: string) {
    const val = parseFloat(balanceInput[id])
    if (isNaN(val)) return
    await fetch('/api/accounts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, current_balance: val }) })
    await fetch('/api/balances', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ account_id: id, amount: val, recorded_at: new Date().toISOString().split('T')[0] }) })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this account and all its data?')) return
    await fetch('/api/accounts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm">+ Add Account</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-lg shadow mb-6 flex gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Account Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="border rounded px-3 py-1.5 text-sm" required placeholder="e.g. ADCB Salary" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Bank</label>
            <input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} className="border rounded px-3 py-1.5 text-sm" required placeholder="e.g. ADCB" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AccountType }))} className="border rounded px-3 py-1.5 text-sm">
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
              <option value="savings">Savings</option>
            </select>
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm">Save</button>
          <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-1.5 text-sm">Cancel</button>
        </form>
      )}

      <div className="grid gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{acc.name}</p>
              <p className="text-sm text-gray-500">{acc.bank_name} · {acc.type}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">AED {acc.current_balance.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</span>
              <input
                type="number"
                placeholder="Update balance"
                value={balanceInput[acc.id] ?? ''}
                onChange={e => setBalanceInput(b => ({ ...b, [acc.id]: e.target.value }))}
                className="border rounded px-2 py-1 text-sm w-36"
              />
              <button onClick={() => handleUpdateBalance(acc.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Update</button>
              <button onClick={() => handleDelete(acc.id)} className="text-red-500 text-sm hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
