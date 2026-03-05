import { apiResponse } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-utils'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request) {
  try {
    await requireAdmin()
    const { email, name } = await request.json()

    if (!email) return apiResponse(400, null, 'Email is required')

    const normalizedEmail = email.trim().toLowerCase()
    const displayName = (name || normalizedEmail.split('@')[0]).trim()

    const supabase = await createClient()
    const admin = createAdminClient()

    // Always enforce author role for invited users.
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingUser?.id) {
      await supabase
        .from('users')
        .update({ role: 'author' })
        .eq('id', existingUser.id)

      const { data: existingAuthor } = await supabase
        .from('authors')
        .select('id')
        .eq('user_id', existingUser.id)
        .maybeSingle()

      if (!existingAuthor) {
        await supabase
          .from('authors')
          .insert({
            user_id: existingUser.id,
            name: displayName,
            email: normalizedEmail,
          })
      }

      return apiResponse(200, { invited: false, existing: true }, null)
    }

    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
      data: { name: displayName },
    })

    if (inviteError) return apiResponse(400, null, inviteError.message)

    return apiResponse(200, { invited: true, existing: false }, null)
  } catch (error) {
    if (error.name === 'AuthError') {
      const status = error.message.includes('Admin') ? 403 : 401
      return apiResponse(status, null, error.message)
    }
    return apiResponse(500, null, error.message || 'Failed to invite author')
  }
}

