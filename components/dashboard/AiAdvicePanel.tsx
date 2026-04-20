'use client'
import { useState } from 'react'

interface Props {
  month: number
  year: number
  initialContent: string | null
}

export function AiAdvicePanel({ month, year, initialContent }: Props) {
  const [content, setContent] = useState(initialContent)
  const [loading, setLoading] = useState(false)

  async function generate(force = false) {
    setLoading(true)
    const params = new URLSearchParams({ month: String(month), year: String(year) })
    if (force) params.set('force', 'true')
    const res = await fetch(`/api/advice?${params}`)
    const data = await res.json()
    setContent(data.content)
    setLoading(false)
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-indigo-900">AI Financial Advice</h2>
        <div className="flex gap-2">
          {content && <button onClick={() => generate(true)} className="text-xs text-indigo-600 hover:underline">Regenerate</button>}
          {!content && (
            <button onClick={() => generate(false)} disabled={loading} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50">
              {loading ? 'Generating...' : 'Generate Advice'}
            </button>
          )}
        </div>
      </div>
      {loading && (
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-indigo-100 rounded w-3/4"></div>
          <div className="h-3 bg-indigo-100 rounded w-1/2"></div>
          <div className="h-3 bg-indigo-100 rounded w-2/3"></div>
        </div>
      )}
      {content && !loading && (
        <div className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{content}</div>
      )}
      {!content && !loading && (
        <p className="text-gray-400 text-sm">Click &quot;Generate Advice&quot; to get AI-powered insights for this month.</p>
      )}
    </div>
  )
}
