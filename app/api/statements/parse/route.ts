import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractTextFromPdf } from '@/lib/pdf-parser'
import { parseStatementWithGemini } from '@/lib/gemini'
import { updateStatementStatus } from '@/lib/db/statements'

export async function POST(req: NextRequest) {
  const { statement_id, file_url } = await req.json()
  try {
    const supabase = createAdminClient()

    const filePath = new URL(file_url).pathname.split('/statements/')[1]
    const { data, error } = await supabase.storage.from('statements').download(filePath)
    if (error) throw error

    const buffer = Buffer.from(await data.arrayBuffer())
    const rawText = await extractTextFromPdf(buffer)
    const parsed = await parseStatementWithGemini(rawText)

    await updateStatementStatus(statement_id, 'parsed')
    return NextResponse.json({ transactions: parsed })
  } catch (e: any) {
    await updateStatementStatus(statement_id, 'failed').catch(() => {})
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
