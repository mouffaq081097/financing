'use client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface CategoryTotal {
  category_id: string
  category_name: string
  total: number
  color: string
}

interface Props {
  data: CategoryTotal[]
}

export function CategoryDonutChart({ data }: Props) {
  if (data.length === 0) return (
    <div className="h-64 flex items-center justify-center text-gray-400">No spending data</div>
  )

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="category_name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `AED ${value.toLocaleString('en-AE', { minimumFractionDigits: 2 })}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
