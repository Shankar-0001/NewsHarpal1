import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { desiredRoleForEmail } from '@/lib/role-utils'

export async function POST(request) {
    try {
        const { email, password } = await request.json()

        const supabase = await createClient()
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 401 })
        }

        const user = data?.user
        if (user?.id && user?.email) {
            const { data: userRow } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .maybeSingle()

            const nextRole = desiredRoleForEmail(user.email, userRow?.role)

            if (nextRole !== userRow?.role) {
                await supabase
                    .from('users')
                    .update({ role: nextRole })
                    .eq('id', user.id)
            }

            // Ensure invited/legacy author accounts have an author profile.
            if (nextRole === 'author') {
                const { data: author } = await supabase
                    .from('authors')
                    .select('id')
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (!author) {
                    await supabase
                        .from('authors')
                        .insert({
                            user_id: user.id,
                            name: user.email.split('@')[0],
                            email: user.email,
                        })
                }
            }
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Auth API error:', error)
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        )
    }
}
