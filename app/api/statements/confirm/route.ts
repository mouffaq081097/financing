import { NextRequest, NextResponse } from 'next/server'
import { bulkInsertTransactions } from '@/lib/db/transactions'
import { addIncome } from '@/lib/db/income'
import { getCategories } from '@/lib/db/categories'
import type { ParsedTransaction, TransactionSource } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { statement_id, account_id, source, transactions }: {
      statement_id: string
      account_id: string
      source: TransactionSource
      transactions: (ParsedTransaction & { category_id?: string })[]
    } = await req.json()

    const categories = await getCategories()
    const categoryMap = Object.fromEntries(categories.map(c => [c.name.toLowerCase(), c.id]))

    const incomeRows = transactions.filter(t => t.is_income)
    const txRows = transactions.filter(t => !t.is_income)

    await bulkInsertTransactions(txRows.map(t => ({
      account_id,
      statement_id,
      date: t.date,
      description: t.description,
      amount: t.type === 'debit' ? -Math.abs(t.amount) : Math.abs(t.amount),
      type: t.type,
      category_id: t.category_id ?? categoryMap[t.category.toLowerCase()] ?? null,
      source,
    })))

    for (const t of incomeRows) {
      await addIncome({
        account_id,
        amount: Math.abs(t.amount),
        source: 'salary',
        description: t.description,
        date: t.date,
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
