import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { CategoryDonutChart } from '@/components/dashboard/CategoryDonutChart'
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart'
import { NetWorthChart } from '@/components/dashboard/NetWorthChart'
import { AiAdvicePanel } from '@/components/dashboard/AiAdvicePanel'
import { getTransactions, getMonthlySummary, getCategoryTotals } from '@/lib/db/transactions'
import { getIncome } from '@/lib/db/income'
import { getNetWorthHistory } from '@/lib/db/balances'
import { getAdvice } from '@/lib/db/advice'

export const dynamic = 'force-dynamic'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string }
}) {
  const now = new Date()
  const month = parseInt(searchParams.month ?? String(now.getMonth() + 1))
  const year = parseInt(searchParams.year ?? String(now.getFullYear()))

  const [transactions, monthlySummary, categoryTotals, income, netWorthHistory, advice] = await Promise.all([
    getTransactions({ month, year }),
    getMonthlySummary(year),
    getCategoryTotals(month, year),
    getIncome({ month, year }),
    getNetWorthHistory(),
    getAdvice(month, year),
  ])

  const creditSpending = transactions
    .filter(t => t.source === 'credit_card' && t.type === 'debit')
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  const debitSpending = transactions
    .filter(t => t.source === 'debit_card' && t.type === 'debit')
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  const totalIncome = income.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-sm text-gray-500">{MONTHS[month - 1]} {year}</span>
      </div>

      <SummaryCards creditSpending={creditSpending} debitSpending={debitSpending} totalIncome={totalIncome} />

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Spending by Category</h2>
          <CategoryDonutChart data={categoryTotals} />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Monthly Spending Trend</h2>
          <MonthlyTrendChart data={monthlySummary} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold mb-4">Net Worth Over Time</h2>
        <NetWorthChart data={netWorthHistory} />
      </div>

      <AiAdvicePanel month={month} year={year} initialContent={advice?.content ?? null} />
    </div>
  )
}
