'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface MonthSummary {
  month: number
  credit_total: number
  debit_total: number
}

interface Props {
  data: MonthSummary[]
}

export function MonthlyTrendChart({ data }: Props) {
  const chartData = data.map(d => ({
    name: MONTH_LABELS[d.month - 1],
    'Credit Card': d.credit_total,
    'Debit Card': d.debit_total,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v: number) => `AED ${v.toLocaleString('en-AE', { minimumFractionDigits: 2 })}`} />
        <Legend />
        <Bar dataKey="Credit Card" fill="#f97316" />
        <Bar dataKey="Debit Card" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  )
}
