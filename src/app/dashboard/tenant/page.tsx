import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import TenantDashboard, { Equipo } from './tenant-dashboard'

export const dynamic = 'force-dynamic'

export default async function TenantPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user profile details and company/tenant name
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id, tenants(name)')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !profile.tenant_id) {
    console.error('Error fetching tenant details:', profileError?.message)
    redirect('/login?error=no-tenant')
  }

  const tenantId = profile.tenant_id
  const tenantName = (profile.tenants as unknown as { name: string })?.name || 'Mi Inquilino'

  // Fetch computers (equipos) for this tenant with their groups
  const { data: equiposData, error: equiposError } = await supabase
    .from('equipos')
    .select('*, equipo_groups(*)')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })

  if (equiposError) {
    console.error('Error fetching equipments for tenant:', equiposError.message)
  }

  const equipos = equiposData || []

  // Fetch groups
  const { data: groupsData, error: groupsError } = await supabase
    .from('equipo_groups')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  if (groupsError) {
    console.error('Error fetching groups for tenant:', groupsError.message)
  }

  const groups = groupsData || []

  // Fetch API keys for this tenant
  const { data: keysData, error: keysError } = await supabase
    .from('tenant_api_keys')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (keysError) {
    console.error('Error fetching api keys for tenant:', keysError.message)
  }

  const apiKeys = keysData || []

  return (
    <TenantDashboard 
      initialEquipos={equipos as unknown as Equipo[]} 
      initialApiKeys={apiKeys}
      initialGroups={groups}
      tenantName={tenantName} 
    />
  )
}
