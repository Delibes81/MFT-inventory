'use client'

import { useState, useTransition } from 'react'
import { createTenant, generateApiKey, deleteApiKey } from './actions'
import { 
  Building2, 
  Key, 
  Trash2, 
  Copy, 
  Check, 
  Plus, 
  Monitor, 
  Calendar,
  Search,
  Download
} from 'lucide-react'

export interface Tenant {
  id: string
  name: string
  created_at: string
  equipos: { id: string }[]
}

export interface ApiKey {
  id: string
  tenant_id: string
  token: string
  name: string
  created_at: string
}

interface AdminPanelProps {
  initialTenants: Tenant[]
  initialApiKeys: ApiKey[]
}

export default function AdminPanel({ initialTenants, initialApiKeys }: AdminPanelProps) {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id || '')
  const [newKeyName, setNewKeyName] = useState('')
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  
  const [isPending, startTransition] = useTransition()
  const [tenantError, setTenantError] = useState<string | null>(null)
  const [keyError, setKeyError] = useState<string | null>(null)

  // Total statistics
  const totalTenants = tenants.length
  const totalEquipos = tenants.reduce((acc, t) => acc + (t.equipos?.length || 0), 0)
  const totalKeys = apiKeys.length

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeKeys = apiKeys.filter(k => k.tenant_id === selectedTenantId)
  const selectedTenant = tenants.find(t => t.id === selectedTenantId)

  // Handle tenant creation
  const handleCreateTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTenantError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    const name = formData.get('name') as string

    if (!name || name.trim() === '') return

    startTransition(async () => {
      const res = await createTenant(formData)
      if (res.error) {
        setTenantError(res.error)
      } else if (res.tenant) {
        const newT: Tenant = {
          id: res.tenant.id,
          name: res.tenant.name,
          created_at: res.tenant.created_at,
          equipos: []
        }
        setTenants(prev => [newT, ...prev])
        if (!selectedTenantId) {
          setSelectedTenantId(newT.id)
        }
        form.reset()
      }
    })
  }

  // Handle generating API key
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setKeyError(null)
    if (!selectedTenantId || !newKeyName.trim()) return

    startTransition(async () => {
      const res = await generateApiKey(selectedTenantId, newKeyName)
      if (res.error) {
        setKeyError(res.error)
      } else if (res.apiKey) {
        setApiKeys(prev => [res.apiKey, ...prev])
        setNewKeyName('')
      }
    })
  }

  // Handle deleting API key
  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este token de acceso?')) return

    startTransition(async () => {
      const res = await deleteApiKey(keyId)
      if (res.error) {
        alert(`Error al eliminar: ${res.error}`)
      } else {
        setApiKeys(prev => prev.filter(k => k.id !== keyId))
      }
    })
  }

  // Copy to clipboard helper
  const handleCopy = (token: string, id: string) => {
    navigator.clipboard.writeText(token)
    setCopiedKeyId(id)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  // Download Agent dynamically with token
  const handleDownloadAgent = async (tokenValue: string, tokenName: string) => {
    try {
      const response = await fetch('/collector.ps1')
      let text = await response.text()
      
      // Inject token and URL
      text = text.replace('INGRESA_TU_TOKEN_DE_INQUILINO_AQUI', tokenValue)
      const currentUrl = window.location.origin
      text = text.replace('$API_URL = "https://mft-inventory.vercel.app"', `$API_URL = "${currentUrl}"`)
      
      const batContent = `@echo off\npowershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$path='%~f0'; $lines=Get-Content $path; $script=$lines[4..($lines.Count-1)] -join [Environment]::NewLine; Invoke-Expression $script"\npause\nexit /b\n` + text;

      const blob = new Blob([batContent], { type: 'application/bat' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      const safeName = tokenName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      a.download = `collector-${safeName}.bat`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error al descargar el agente:', err)
      alert('Hubo un error al preparar el agente para su descarga.')
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Panel de Control General</h2>
          <p className="text-sm text-slate-400">Administra los clientes e inquilinos del sistema y sus claves de recopilación.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/collector.ps1"
            download
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-colors border border-slate-700 shadow-sm"
          >
            <Download className="h-4 w-4" />
            Descargar Agente
          </a>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <div className="relative overflow-hidden backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-black/20 group">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Clientes Activos</span>
            <span className="text-3xl font-extrabold text-slate-200 mt-1 block">{totalTenants}</span>
          </div>
          <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
            <Building2 className="h-6 w-6 text-violet-400" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="relative overflow-hidden backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-black/20 group">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Equipos Registrados</span>
            <span className="text-3xl font-extrabold text-slate-200 mt-1 block">{totalEquipos}</span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
            <Monitor className="h-6 w-6 text-indigo-400" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="relative overflow-hidden backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-black/20 group">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Tokens Generados</span>
            <span className="text-3xl font-extrabold text-slate-200 mt-1 block">{totalKeys}</span>
          </div>
          <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
            <Key className="h-6 w-6 text-teal-400" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tenants List & Creation Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Create Tenant Form */}
          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/10">
            <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-violet-400" /> Registrar Nuevo Inquilino
            </h3>
            <form onSubmit={handleCreateTenant} className="flex gap-4">
              <div className="flex-1">
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Nombre de la empresa (e.g. Acme Corp)"
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-150 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition-all duration-150 shadow-lg shadow-violet-900/15 disabled:opacity-50"
              >
                Crear
              </button>
            </form>
            {tenantError && (
              <p className="mt-2 text-xs text-rose-400">{tenantError}</p>
            )}
          </div>

          {/* Tenants List */}
          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/10">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-bold text-slate-200">Lista de Inquilinos</h3>
              <div className="relative w-full md:w-64">
                <Search className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-slate-500 flex items-center justify-center pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar inquilino..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Cliente / Inquilino</th>
                    <th className="pb-3">ID del Cliente</th>
                    <th className="pb-3 text-center">Equipos</th>
                    <th className="pb-3">Fecha de Creación</th>
                    <th className="pb-3 text-right pr-2">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No se encontraron inquilinos.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map(t => (
                      <tr key={t.id} className="hover:bg-slate-900/20 transition-colors group">
                        <td className="py-4 pl-2 font-semibold text-slate-200 flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-violet-400/80" />
                          {t.name}
                        </td>
                        <td className="py-4 text-xs font-mono text-slate-400">{t.id}</td>
                        <td className="py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/10">
                            <Monitor className="h-3 w-3" />
                            {t.equipos?.length || 0}
                          </span>
                        </td>
                        <td className="py-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(t.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 text-right pr-2">
                          <button
                            onClick={() => setSelectedTenantId(t.id)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                              selectedTenantId === t.id
                                ? 'bg-violet-600 text-white border-violet-500'
                                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            Configurar Keys
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* API Key Management Panel */}
        <div className="space-y-6">
          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/10">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-4 mb-6">
              <Key className="h-5 w-5 text-teal-400" />
              <div>
                <h3 className="text-lg font-bold text-slate-200">Claves del Cliente</h3>
                <span className="text-xs text-slate-500">Agente Recopilador</span>
              </div>
            </div>

            {selectedTenant ? (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Cliente Seleccionado</span>
                  <div className="text-sm font-semibold text-slate-200 flex items-center gap-2 bg-slate-950/40 border border-slate-800 px-3 py-2 rounded-xl">
                    <Building2 className="h-4 w-4 text-violet-400" />
                    {selectedTenant.name}
                  </div>
                </div>

                {/* Generate New Key Form */}
                <form onSubmit={handleGenerateKey} className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Generar Nuevo Token</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Nombre del Token (e.g. Servidor Principal)"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 text-xs"
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-teal-900/10"
                    >
                      Generar
                    </button>
                  </div>
                  {keyError && (
                    <p className="text-xs text-rose-400">{keyError}</p>
                  )}
                </form>

                {/* Keys list */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tokens Activos</span>
                  
                  {activeKeys.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4 bg-slate-950/20 rounded-xl border border-dashed border-slate-800/80">
                      No hay tokens de recopilación creados.
                    </p>
                  ) : (
                    activeKeys.map(k => (
                      <div key={k.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2 relative group hover:border-slate-800 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300">{k.name}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => handleDownloadAgent(k.token, k.name)}
                              className="text-slate-500 hover:text-teal-400 p-1 rounded-lg hover:bg-teal-500/10"
                              title="Descargar Agente con este Token"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteKey(k.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10"
                              title="Eliminar Token"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center bg-slate-950 border border-slate-900 px-2 py-1 rounded-lg">
                          <span className="font-mono text-[10px] text-slate-400 truncate flex-1">{k.token}</span>
                          <button
                            onClick={() => handleCopy(k.token, k.id)}
                            className="text-slate-500 hover:text-slate-200 transition-colors p-1"
                          >
                            {copiedKeyId === k.id ? (
                              <Check className="h-3.5 w-3.5 text-teal-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[9px] text-slate-500 block">
                          Generada: {new Date(k.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                Selecciona o crea un inquilino a la izquierda para configurar sus API Keys.
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  )
}
