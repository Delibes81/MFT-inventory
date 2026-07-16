import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import GroupsManager from './groups-manager'
import { Equipo } from '../tenant-dashboard'

export const dynamic = 'force-dynamic'

export default async function TenantGroupsPage() {
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

  // Fetch in parallel
  const [
    { data: equiposData, error: equiposError },
    { data: groupsData, error: groupsError }
  ] = await Promise.all([
    supabase
      .from('equipos')
      .select('*, equipo_groups(*)')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('equipo_groups')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })
  ])

  if (equiposError) console.error('Error fetching equipments for tenant:', equiposError.message)
  if (groupsError) console.error('Error fetching groups for tenant:', groupsError.message)

  const equipos = equiposData || []
  const groups = groupsData || []

  return (
    <GroupsManager 
      initialEquipos={equipos as unknown as Equipo[]} 
      initialGroups={groups}
      tenantName={tenantName} 
    />
  )
}
