import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // If user has no profile, sign out and redirect to login
    await supabase.auth.signOut()
    redirect('/login?error=no-profile')
  }

  if (profile.role === 'super_admin') {
    redirect('/dashboard/admin')
  } else {
    redirect('/dashboard/tenant')
  }
}
