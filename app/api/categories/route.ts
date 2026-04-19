import { NextRequest, NextResponse } from 'next/server'
import { getCategories, updateCategory } from '@/lib/db/categories'

export async function GET() {
  try {
    return NextResponse.json(await getCategories())
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    await updateCategory(id, updates)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
