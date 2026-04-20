'use client'
import { useEffect, useState } from 'react'
import type { Account, Category, Transaction } from '@/types'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filter, setFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), account_id: '', category_id: '' })

  async function load() {
    const params = new URLSearchParams()
    if (filter.month) params.set('month', String(filter.month))
    if (filter.year) params.set('year', String(filter.year))
    if (filter.account_id) params.set('account_id', filter.account_id)
    if (filter.category_id) params.set('category_id', filter.category_id)

    const [tRes, aRes, cRes] = await Promise.all([
      fetch(`/api/transactions?${params}`),
      fetch('/api/accounts'),
      fetch('/api/categories')
    ])
    setTransactions(await tRes.json())
    setAccounts(await aRes.json())
    setCategories(await cRes.json())
  }

  useEffect(() => { load() }, [filter.month, filter.year, filter.account_id, filter.category_id])

  async function handleCategoryChange(id: string, category_id: string) {
    await fetch('/api/transactions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, category_id })
    })
    setTransactions(ts => ts.map(t => t.id === id ? { ...t, category_id, categories: categories.find(c => c.id === category_id) } : t))
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>
      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={filter.month} onChange={e => setFilter(f => ({ ...f, month: parseInt(e.target.value) }))} className="border rounded px-3 py-1.5 text-sm">
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <input type="number" value={filter.year} onChange={e => setFilter(f => ({ ...f, year: parseInt(e.target.value) }))} className="border rounded px-3 py-1.5 text-sm w-24" />
        <select value={filter.account_id} onChange={e => setFilter(f => ({ ...f, account_id: e.target.value }))} className="border rounded px-3 py-1.5 text-sm">
          <option value="">All accounts</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={filter.category_id} onChange={e => setFilter(f => ({ ...f, category_id: e.target.value }))} className="border rounded px-3 py-1.5 text-sm">
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500 bg-gray-50">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Account</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr></thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{t.date}</td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{t.description}</td>
                <td className="px-4 py-3 text-gray-500">{(t.accounts as any)?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <select value={t.category_id ?? ''} onChange={e => handleCategoryChange(t.id, e.target.value)} className="border rounded px-2 py-0.5 text-xs">
                    <option value="">Uncategorized</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </td>
                <td className={`px-4 py-3 text-right font-medium ${t.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                  {t.type === 'credit' ? '+' : '-'}AED {Math.abs(t.amount).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && <p className="text-center text-gray-400 py-12">No transactions found</p>}
      </div>
    </div>
  )
}
