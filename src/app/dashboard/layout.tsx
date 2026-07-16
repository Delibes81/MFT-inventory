import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signOut } from './actions'
import { Monitor, Building2, LogOut, ShieldAlert, Cpu, FolderTree } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user profile details and company/tenant name
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id, tenants(name)')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.role === 'super_admin'
  const tenantName = (profile?.tenants as unknown as { name: string })?.name || 'MFT Global'
  const userEmail = user.email || 'usuario@mft.com'

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-slate-900/40 backdrop-blur-xl flex flex-col shrink-0">
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-900 flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <Cpu className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="font-bold text-slate-200 text-sm tracking-tight leading-none">MFT Inventory</h1>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Enterprise Console</span>
          </div>
        </div>

        {/* User Badge */}
        <div className="p-4 mx-4 my-6 bg-slate-950/40 border border-slate-800/60 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-md shadow-violet-900/10">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{userEmail}</p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                {isSuperAdmin ? (
                  <>
                    <ShieldAlert className="h-3 w-3 text-violet-400" />
                    Super Admin
                  </>
                ) : (
                  <>
                    <Building2 className="h-3 w-3 text-indigo-400" />
                    {tenantName}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {isSuperAdmin ? (
            <>
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-3 mb-2">Administración</div>
              <a
                href="/dashboard/admin"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-all duration-150 group"
              >
                <Building2 className="h-4 w-4 text-slate-400 group-hover:text-violet-400 transition-colors" />
                Clientes (Tenants)
              </a>
            </>
          ) : (
            <>
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-3 mb-2">Portal de Inquilino</div>
              <a
                href="/dashboard/tenant"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-all duration-150 group"
              >
                <Monitor className="h-4 w-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                Mis Equipos
              </a>
              <a
                href="/dashboard/tenant/groups"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-all duration-150 group"
              >
                <FolderTree className="h-4 w-4 text-slate-400 group-hover:text-teal-400 transition-colors" />
                Gestor de Grupos
              </a>
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/20">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 rounded-xl transition-all duration-150"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950/80 overflow-y-auto">
        <div className="p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>

    </div>
  )
}
