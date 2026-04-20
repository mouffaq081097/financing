import { NextRequest, NextResponse } from 'next/server'
import { getAdvice, saveAdvice } from '@/lib/db/advice'
import { getCategoryTotals, getMonthlySummary } from '@/lib/db/transactions'
import { getIncome } from '@/lib/db/income'
import { generateAdviceWithGemini } from '@/lib/gemini'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))

  try {
    const existing = await getAdvice(month, year)
    if (existing && searchParams.get('force') !== 'true') {
      return NextResponse.json(existing)
    }

    const [categoryTotals, monthlyIncome] = await Promise.all([
      getCategoryTotals(month, year),
      getIncome({ month, year }),
    ])

    const totalIncome = monthlyIncome.reduce((s, i) => s + i.amount, 0)
    const totalSpending = categoryTotals.reduce((s, c) => s + c.total, 0)

    const summary = `
Month: ${month}/${year}
Total Income: AED ${totalIncome.toFixed(2)}
Total Spending: AED ${totalSpending.toFixed(2)}
Net Savings: AED ${(totalIncome - totalSpending).toFixed(2)}

Spending by category:
${categoryTotals.map(c => `- ${c.category_name}: AED ${c.total.toFixed(2)}`).join('\n')}
`

    const content = await generateAdviceWithGemini(summary)
    await saveAdvice(month, year, content)

    return NextResponse.json({ month, year, content, generated_at: new Date().toISOString() })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
