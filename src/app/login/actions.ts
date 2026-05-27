'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function authenticate(state: unknown, formData: FormData) {
  const mode = formData.get('mode') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return { error: 'El correo y la contraseña son requeridos' }
  }

  const supabase = createClient()

  if (mode === 'register') {
    const tenantId = formData.get('tenantId') as string
    
    if (!tenantId) {
      return { error: 'El ID de cliente es requerido para registrarse' }
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      return { error: 'El ID de cliente proporcionado no es válido' }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          tenant_id: tenantId,
          role: 'tenant_user'
        }
      }
    })

    if (error) return { error: error.message }
  } else {
    // mode === 'login'
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) return { error: error.message }
  }

  redirect('/dashboard')
}
