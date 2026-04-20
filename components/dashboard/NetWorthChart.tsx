'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface NetWorthPoint {
  date: string
  net_worth: number
}

interface Props {
  data: NetWorthPoint[]
}

export function NetWorthChart({ data }: Props) {
  if (data.length === 0) return (
    <div className="h-64 flex items-center justify-center text-gray-400">Add balance snapshots via Accounts to track net worth</div>
  )

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v: number) => `AED ${v.toLocaleString('en-AE', { minimumFractionDigits: 2 })}`} />
        <Line type="monotone" dataKey="net_worth" stroke="#6366f1" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
