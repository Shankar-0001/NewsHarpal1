import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request, { params }) {
    try {
        const data = await request.json()
        const supabase = await createClient()

        const { error } = await supabase
            .from('articles')
            .update(data)
            .eq('id', params.id)

        if (error) {
            console.error('Supabase update error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('API update error', err)
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('articles')
            .delete()
            .eq('id', params.id)

        if (error) {
            console.error('Supabase delete error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('API delete error', err)
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}
