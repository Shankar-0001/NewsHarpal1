import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const authorData = await request.json()
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('authors')
            .insert([authorData])
            .select()
            .single()

        if (error) {
            console.error('Supabase author insert error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ author: data })
    } catch (err) {
        console.error('API author creation error', err)
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}

export async function PATCH(request) {
    try {
        const { id, ...updateData } = await request.json()
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('authors')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Supabase author update error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ author: data })
    } catch (err) {
        console.error('API author update error', err)
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const { id } = await request.json()
        const supabase = await createClient()

        const { error } = await supabase
            .from('authors')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Supabase author delete error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('API author delete error', err)
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}
