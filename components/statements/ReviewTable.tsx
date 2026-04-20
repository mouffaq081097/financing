'use client'
import { useState } from 'react'
import type { ParsedTransaction } from '@/types'

interface Props {
  transactions: ParsedTransaction[]
  categories: { id: string; name: string }[]
  onConfirm: (transactions: ParsedTransaction[]) => void
  onCancel: () => void
}

export function ReviewTable({ transactions: initial, categories, onConfirm, onCancel }: Props) {
  const [rows, setRows] = useState(initial)

  function updateRow(index: number, updates: Partial<ParsedTransaction>) {
    setRows(r => r.map((row, i) => i === index ? { ...row, ...updates } : row))
  }

  function removeRow(index: number) {
    setRows(r => r.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4">Amount (AED)</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Income?</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="py-1.5 pr-4">
                  <input type="date" value={row.date} onChange={e => updateRow(i, { date: e.target.value })} className="border rounded px-2 py-0.5 text-xs" />
                </td>
                <td className="py-1.5 pr-4">
                  <input value={row.description} onChange={e => updateRow(i, { description: e.target.value })} className="border rounded px-2 py-0.5 text-xs w-48" />
                </td>
                <td className="py-1.5 pr-4">
                  <input type="number" value={row.amount} onChange={e => updateRow(i, { amount: parseFloat(e.target.value) })} className="border rounded px-2 py-0.5 text-xs w-24" />
                </td>
                <td className="py-1.5 pr-4">
                  <select value={row.type} onChange={e => updateRow(i, { type: e.target.value as any })} className="border rounded px-2 py-0.5 text-xs">
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                </td>
                <td className="py-1.5 pr-4">
                  <select value={row.category} onChange={e => updateRow(i, { category: e.target.value })} className="border rounded px-2 py-0.5 text-xs">
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </td>
                <td className="py-1.5 pr-4">
                  <input type="checkbox" checked={row.is_income} onChange={e => updateRow(i, { is_income: e.target.checked })} />
                </td>
                <td className="py-1.5">
                  <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={() => onConfirm(rows)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm">
          Save {rows.length} transactions
        </button>
        <button onClick={onCancel} className="text-gray-500 px-4 py-2 text-sm">Cancel</button>
      </div>
    </div>
  )
}
