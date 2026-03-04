import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const relations = await request.json()
        const supabase = await createClient()
        const { error } = await supabase
            .from('article_tags')
            .insert(relations)
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('article_tags API error', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}