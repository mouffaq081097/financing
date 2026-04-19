import { NextRequest, NextResponse } from 'next/server'
import { getTransactions, updateTransactionCategory, getMonthlySummary, getCategoryTotals } from '@/lib/db/transactions'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  try {
    if (searchParams.get('summary') === 'monthly') {
      const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
      return NextResponse.json(await getMonthlySummary(year))
    }
    if (searchParams.get('summary') === 'categories') {
      const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
      const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
      return NextResponse.json(await getCategoryTotals(month, year))
    }
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const account_id = searchParams.get('account_id') ?? undefined
    const category_id = searchParams.get('category_id') ?? undefined
    return NextResponse.json(await getTransactions({ month, year, account_id, category_id }))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, category_id } = await req.json()
    await updateTransactionCategory(id, category_id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
