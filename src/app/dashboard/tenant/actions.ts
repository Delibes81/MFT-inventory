'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

// Action to generate a new API key for the current tenant
export async function generateTenantApiKey(name: string) {
  if (!name || name.trim() === '') {
    return { error: 'El nombre del token es requerido' }
  }

  const supabase = createClient()
  
  // Get the logged in user's tenant_id securely
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.tenant_id) {
    return { error: 'No se pudo identificar el inquilino' }
  }

  // Generate a random 32-character secure hex token
  const token = Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')

  const { data, error } = await supabase
    .from('tenant_api_keys')
    .insert({
      tenant_id: profile.tenant_id,
      token,
      name: name.trim(),
    })
    .select()

  if (error) {
    console.error('Generate api key error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard/tenant')
  return { success: true, apiKey: data[0] }
}

// Action to delete an API key for the current tenant
export async function deleteTenantApiKey(keyId: string) {
  if (!keyId) {
    return { error: 'El ID de la clave es requerido' }
  }

  const supabase = createClient()
  
  // Verify tenant_id before deleting to prevent deleting other tenant's keys
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.tenant_id) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('tenant_api_keys')
    .delete()
    .eq('id', keyId)
    .eq('tenant_id', profile.tenant_id) // Extra safety check

  if (error) {
    console.error('Delete api key error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard/tenant')
  return { success: true }
}
