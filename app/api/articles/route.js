import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const articleData = await request.json()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('articles')
      .insert(articleData)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ article: data })
  } catch (err) {
    console.error('API create article error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
