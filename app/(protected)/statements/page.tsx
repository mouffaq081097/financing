'use client'
import { useEffect, useState } from 'react'
import { ReviewTable } from '@/components/statements/ReviewTable'
import type { Account, Category, ParsedTransaction, Statement } from '@/types'

type Step = 'list' | 'upload' | 'parsing' | 'review' | 'saving'

export default function StatementsPage() {
  const [statements, setStatements] = useState<Statement[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [step, setStep] = useState<Step>('list')
  const [parsedTxs, setParsedTxs] = useState<ParsedTransaction[]>([])
  const [currentStatement, setCurrentStatement] = useState<Statement | null>(null)
  const [form, setForm] = useState({ account_id: '', month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()) })
  const [error, setError] = useState('')

  async function load() {
    const [stRes, acRes, catRes] = await Promise.all([
      fetch('/api/statements'), fetch('/api/accounts'), fetch('/api/categories')
    ])
    setStatements(await stRes.json())
    setAccounts(await acRes.json())
    setCategories(await catRes.json())
  }

  useEffect(() => { load() }, [])

  async function handleUploadAndParse(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const fileInput = document.getElementById('pdf-file') as HTMLInputElement
    if (!fileInput.files?.[0]) return

    setStep('parsing')
    const formData = new FormData()
    formData.append('file', fileInput.files[0])
    formData.append('account_id', form.account_id)
    formData.append('month', form.month)
    formData.append('year', form.year)

    const uploadRes = await fetch('/api/statements/upload', { method: 'POST', body: formData })
    if (!uploadRes.ok) { setError('Upload failed'); setStep('upload'); return }
    const statement: Statement = await uploadRes.json()
    setCurrentStatement(statement)

    const parseRes = await fetch('/api/statements/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statement_id: statement.id, file_url: statement.file_url })
    })
    if (!parseRes.ok) { setError('Parsing failed'); setStep('upload'); return }
    const { transactions } = await parseRes.json()
    setParsedTxs(transactions)
    setStep('review')
  }

  async function handleConfirm(transactions: ParsedTransaction[]) {
    if (!currentStatement) return
    setStep('saving')
    const account = accounts.find(a => a.id === currentStatement.account_id)
    const source = account?.type === 'credit' ? 'credit_card' : 'debit_card'
    await fetch('/api/statements/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statement_id: currentStatement.id, account_id: currentStatement.account_id, source, transactions })
    })
    setStep('list')
    load()
  }

  if (step === 'parsing') return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Parsing statement with AI...</p>
      </div>
    </div>
  )

  if (step === 'review') return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Review Transactions</h1>
      <p className="text-gray-500 text-sm mb-6">Review AI-parsed transactions. Edit, delete, or fix any errors before saving.</p>
      <div className="bg-white rounded-lg shadow p-6">
        <ReviewTable transactions={parsedTxs} categories={categories} onConfirm={handleConfirm} onCancel={() => setStep('list')} />
      </div>
    </div>
  )

  if (step === 'saving') return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-600">Saving transactions...</p>
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Statements</h1>
        <button onClick={() => setStep('upload')} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm">+ Upload PDF</button>
      </div>

      {step === 'upload' && (
        <form onSubmit={handleUploadAndParse} className="bg-white p-6 rounded-lg shadow mb-6 flex flex-col gap-4 max-w-lg">
          <h2 className="font-semibold">Upload Statement PDF</h2>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Account</label>
            <select value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))} className="border rounded px-3 py-1.5 text-sm w-full" required>
              <option value="">Select account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bank_name})</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Month</label>
              <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} className="border rounded px-3 py-1.5 text-sm w-full">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Year</label>
              <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="border rounded px-3 py-1.5 text-sm w-full" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">PDF File</label>
            <input id="pdf-file" type="file" accept=".pdf" className="text-sm" required />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm">Upload &amp; Parse</button>
            <button type="button" onClick={() => setStep('list')} className="text-gray-500 text-sm px-4 py-2">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500 bg-gray-50">
            <th className="px-4 py-3">Account</th>
            <th className="px-4 py-3">Period</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Uploaded</th>
          </tr></thead>
          <tbody>
            {statements.map(s => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{(s.accounts as any)?.name ?? '—'}</td>
                <td className="px-4 py-3">{s.month}/{s.year}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.parse_status === 'parsed' ? 'bg-green-100 text-green-700' : s.parse_status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {s.parse_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(s.upload_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {statements.length === 0 && <p className="text-center text-gray-400 py-12">No statements uploaded yet</p>}
      </div>
    </div>
  )
}
