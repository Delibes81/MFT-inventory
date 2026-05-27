'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

// Action to create a new tenant (company)
export async function createTenant(formData: FormData) {
  const name = formData.get('name') as string

  if (!name || name.trim() === '') {
    return { error: 'El nombre del inquilino es requerido' }
  }

  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('tenants')
    .insert({ name: name.trim() })
    .select()

  if (error) {
    console.error('Create tenant error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard/admin')
  return { success: true, tenant: data[0] }
}

// Action to generate a new API key for a tenant
export async function generateApiKey(tenantId: string, name: string) {
  if (!tenantId) {
    return { error: 'El ID del inquilino es requerido' }
  }
  if (!name || name.trim() === '') {
    return { error: 'El nombre del token es requerido' }
  }

  // Generate a random 32-character secure hex token
  const token = Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')

  const supabase = createClient()

  const { data, error } = await supabase
    .from('tenant_api_keys')
    .insert({
      tenant_id: tenantId,
      token,
      name: name.trim(),
    })
    .select()

  if (error) {
    console.error('Generate api key error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard/admin')
  return { success: true, apiKey: data[0] }
}

// Action to delete an API key
export async function deleteApiKey(keyId: string) {
  if (!keyId) {
    return { error: 'El ID de la clave es requerido' }
  }

  const supabase = createClient()

  const { error } = await supabase
    .from('tenant_api_keys')
    .delete()
    .eq('id', keyId)

  if (error) {
    console.error('Delete api key error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/dashboard/admin')
  return { success: true }
}
