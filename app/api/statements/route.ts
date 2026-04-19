import { NextResponse } from 'next/server'
import { getStatements } from '@/lib/db/statements'

export async function GET() {
  try {
    return NextResponse.json(await getStatements())
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
