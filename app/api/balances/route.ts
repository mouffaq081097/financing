import { NextRequest, NextResponse } from 'next/server'
import { getBalances, addBalanceSnapshot, getNetWorthHistory } from '@/lib/db/balances'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  try {
    if (searchParams.get('history') === 'true') {
      return NextResponse.json(await getNetWorthHistory())
    }
    return NextResponse.json(await getBalances())
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await addBalanceSnapshot(await req.json())
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
