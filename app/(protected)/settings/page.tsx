'use client'
import { useEffect, useState } from 'react'
import type { Category } from '@/types'

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [editing, setEditing] = useState<Record<string, Partial<Category>>>({})

  async function load() {
    const res = await fetch('/api/categories')
    setCategories(await res.json())
  }

  useEffect(() => { load() }, [])

  function handleEdit(id: string, field: keyof Category, value: string) {
    setEditing(e => ({ ...e, [id]: { ...e[id], [field]: value } }))
  }

  async function handleSave(id: string) {
    const updates = editing[id]
    if (!updates) return
    await fetch('/api/categories', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) })
    setEditing(e => { const n = { ...e }; delete n[id]; return n })
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <h2 className="text-lg font-semibold mb-4">Categories</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500 bg-gray-50">
            <th className="px-4 py-3">Icon</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Color</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {categories.map(cat => {
              const edits = editing[cat.id] ?? {}
              return (
                <tr key={cat.id} className="border-b">
                  <td className="px-4 py-3">
                    <input value={edits.icon ?? cat.icon} onChange={e => handleEdit(cat.id, 'icon', e.target.value)} className="border rounded px-2 py-0.5 text-sm w-16 text-center" />
                  </td>
                  <td className="px-4 py-3">
                    <input value={edits.name ?? cat.name} onChange={e => handleEdit(cat.id, 'name', e.target.value)} className="border rounded px-2 py-0.5 text-sm w-36" />
                  </td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <input type="color" value={edits.color ?? cat.color} onChange={e => handleEdit(cat.id, 'color', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                    <span className="text-xs text-gray-400">{edits.color ?? cat.color}</span>
                  </td>
                  <td className="px-4 py-3">
                    {editing[cat.id] && (
                      <button onClick={() => handleSave(cat.id)} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs">Save</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
