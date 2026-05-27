import { createClient } from '@/utils/supabase/server'
import AdminPanel, { Tenant, ApiKey } from './admin-panel'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createClient()

  // Fetch all tenants with their computers count
  const { data: tenantsData, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, name, created_at, equipos(id)')
    .order('created_at', { ascending: false })

  if (tenantsError) {
    console.error('Error fetching tenants for admin dashboard:', tenantsError.message)
  }

  // Fetch all API keys
  const { data: keysData, error: keysError } = await supabase
    .from('tenant_api_keys')
    .select('id, name, token, tenant_id, created_at')
    .order('created_at', { ascending: false })

  if (keysError) {
    console.error('Error fetching api keys for admin dashboard:', keysError.message)
  }

  const tenants = tenantsData || []
  const apiKeys = keysData || []

  return (
    <AdminPanel 
      initialTenants={tenants as unknown as Tenant[]} 
      initialApiKeys={apiKeys as unknown as ApiKey[]} 
    />
  )
}
