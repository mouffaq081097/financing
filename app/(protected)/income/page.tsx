'use client'
import { useEffect, useState } from 'react'
import type { Account, Income, IncomeSource } from '@/types'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function IncomePage() {
  const [income, setIncome] = useState<Income[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ account_id: '', amount: '', source: 'salary' as IncomeSource, description: '', date: new Date().toISOString().split('T')[0] })
  const [filter, setFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() })

  async function load() {
    const [iRes, aRes] = await Promise.all([
      fetch(`/api/income?month=${filter.month}&year=${filter.year}`),
      fetch('/api/accounts')
    ])
    setIncome(await iRes.json())
    setAccounts(await aRes.json())
  }

  useEffect(() => { load() }, [filter.month, filter.year])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/income', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) })
    setShowForm(false)
    setForm({ account_id: '', amount: '', source: 'salary', description: '', date: new Date().toISOString().split('T')[0] })
    load()
  }

  const total = income.reduce((s, i) => s + i.amount, 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Income</h1>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm">+ Add Income</button>
      </div>
      <div className="flex gap-3 mb-6">
        <select value={filter.month} onChange={e => setFilter(f => ({ ...f, month: parseInt(e.target.value) }))} className="border rounded px-3 py-1.5 text-sm">
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <input type="number" value={filter.year} onChange={e => setFilter(f => ({ ...f, year: parseInt(e.target.value) }))} className="border rounded px-3 py-1.5 text-sm w-24" />
      </div>
      <div className="bg-indigo-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-indigo-600">Total Income this month</p>
        <p className="text-3xl font-bold text-indigo-700">AED {total.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</p>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Account</label>
            <select value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))} className="border rounded px-3 py-1.5 text-sm w-full" required>
              <option value="">Select account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Amount (AED)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="border rounded px-3 py-1.5 text-sm w-full" required />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Source</label>
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as IncomeSource }))} className="border rounded px-3 py-1.5 text-sm w-full">
              <option value="salary">Salary</option>
              <option value="freelance">Freelance</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="border rounded px-3 py-1.5 text-sm w-full" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 block mb-1">Description (optional)</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="border rounded px-3 py-1.5 text-sm w-full" />
          </div>
          <div className="col-span-2 flex gap-3">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 text-sm">Cancel</button>
          </div>
        </form>
      )}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500 bg-gray-50">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Account</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr></thead>
          <tbody>
            {income.map(i => (
              <tr key={i.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{i.date}</td>
                <td className="px-4 py-3 text-gray-600">{i.description ?? '—'}</td>
                <td className="px-4 py-3 capitalize">{i.source}</td>
                <td className="px-4 py-3">{(i.accounts as any)?.name ?? '—'}</td>
                <td className="px-4 py-3 text-right font-medium text-green-600">AED {i.amount.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {income.length === 0 && <p className="text-center text-gray-400 py-12">No income entries yet</p>}
      </div>
    </div>
  )
}
