import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const { email, password, name, role } = await request.json()

        const supabase = await createClient()

        // Sign up the user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        })

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        const userId = authData.user?.id
        if (!userId) {
            return NextResponse.json({ error: 'User creation failed' }, { status: 400 })
        }

        // Update user role
        const { error: updateError } = await supabase
            .from('users')
            .update({ role: role || 'author' })
            .eq('id', userId)

        if (updateError) {
            console.error('Error updating role:', updateError)
        }

        // Create author profile
        const { error: authorError } = await supabase
            .from('authors')
            .insert({
                user_id: userId,
                name: name || email.split('@')[0],
            })

        if (authorError) {
            console.error('Error creating author profile:', authorError)
        }

        return NextResponse.json({
            user: authData.user,
            message: 'Signup successful'
        })
    } catch (error) {
        console.error('Signup API error:', error)
        return NextResponse.json(
            { error: 'Registration failed' },
            { status: 500 }
        )
    }
}
