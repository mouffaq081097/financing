import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStatement } from '@/lib/db/statements'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const account_id = formData.get('account_id') as string
    const month = parseInt(formData.get('month') as string)
    const year = parseInt(formData.get('year') as string)

    const supabase = createAdminClient()
    const fileName = `${account_id}/${year}-${month}-${Date.now()}.pdf`
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await supabase.storage
      .from('statements')
      .upload(fileName, buffer, { contentType: 'application/pdf' })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('statements').getPublicUrl(fileName)

    const statement = await createStatement({ account_id, month, year, file_url: publicUrl })
    return NextResponse.json(statement, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
