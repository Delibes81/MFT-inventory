'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Monitor, 
  Layers,
  HardDrive,
  Search,
  User,
  ShieldCheck,
  Activity,
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  Download
} from 'lucide-react'
import { generateTenantApiKey, deleteTenantApiKey, createEquipoGroup, deleteEquipoGroup } from './actions'

export interface RAMModule {
  capacity_gb: number
  speed_mhz: number
  part_number: string
  manufacturer: string
  memory_type?: string
  form_factor?: string
}

export interface ApiKey {
  id: string
  name: string
  token: string
  created_at: string
}

interface RAMDetails {
  total_gb: number
  modules: RAMModule[]
}

export interface DiskDrive {
  drive_letter: string
  type: string
  size_gb: number
  free_space_gb: number
  used_space_gb: number
}

interface DiskDetails {
  total_gb: number
  drives: DiskDrive[]
}

export interface FileItem {
  name: string
  type: string
  creation_time: string
  last_write_time: string
  hidden: boolean
}

export interface StartupProgram {
  name: string
  command: string
  location: string
  user: string
}

export interface EquipoGroup {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface Equipo {
  id: string
  hostname: string
  domain: string | null
  os: string
  processor: string
  ram_details: RAMDetails
  disk_details: DiskDetails
  last_user: string
  serial_number: string
  model: string
  manufacturer: string
  antivirus: string | null
  office_version: string | null
  files_list?: FileItem[] | null
  startup_programs?: StartupProgram[] | null
  notes?: string | null
  group_id?: string | null
  equipo_groups?: EquipoGroup | null
  updated_at: string
}

interface TenantDashboardProps {
  initialEquipos: Equipo[]
  initialApiKeys: ApiKey[]
  initialGroups: EquipoGroup[]
  tenantName: string
}

export default function TenantDashboard({ initialEquipos, initialApiKeys, initialGroups, tenantName }: TenantDashboardProps) {
  const [equipos] = useState<Equipo[]>(initialEquipos)
  const [apiKeys] = useState<ApiKey[]>(initialApiKeys)
  const [groups] = useState<EquipoGroup[]>(initialGroups)
  const [activeTab, setActiveTab] = useState<'inventory' | 'groups' | 'agent'>('inventory')
  const [selectedFilterGroup, setSelectedFilterGroup] = useState<string>('all')
  
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  
  // Agent state
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Group state
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const groupFormRef = useRef<HTMLFormElement>(null)

  // Copy to clipboard helper
  const handleCopy = (token: string, id: string) => {
    navigator.clipboard.writeText(token)
    setCopiedKeyId(id)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  // Download Agent helper
  const handleDownloadAgent = async (token: string, tokenName: string) => {
    try {
      const res = await fetch('/collector.ps1')
      if (!res.ok) throw new Error('No se pudo descargar la plantilla.')
      
      let text = await res.text()
      
      // Inject token and URL
      text = text.replace('INGRESA_TU_TOKEN_DE_INQUILINO_AQUI', token)
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
      alert('Error descargando el agente. Intenta de nuevo.')
      console.error(err)
    }
  }

  // Filters
  const filteredEquipos = equipos.filter(e => {
    // Check group filter
    if (selectedFilterGroup === 'unassigned') {
      if (e.group_id) return false
    } else if (selectedFilterGroup !== 'all') {
      if (e.group_id !== selectedFilterGroup) return false
    }

    // Check search query
    if (searchQuery.trim() === '') return true
    
    const query = searchQuery.toLowerCase()
    return (
      e.hostname.toLowerCase().includes(query) ||
      e.os.toLowerCase().includes(query) ||
      e.last_user.toLowerCase().includes(query) ||
      (e.domain || '').toLowerCase().includes(query) ||
      e.serial_number.toLowerCase().includes(query)
    )
  })

  // Computations
  const totalComputers = equipos.length
  
  const avgRam = totalComputers > 0 
    ? Math.round(equipos.reduce((acc, e) => acc + (e.ram_details?.total_gb || 0), 0) / totalComputers)
    : 0

  const totalStorage = totalComputers > 0
    ? equipos.reduce((acc, e) => acc + (e.disk_details?.total_gb || 0), 0)
    : 0

  // OS Distribution calculation
  const osCount: { [key: string]: number } = {}
  equipos.forEach(e => {
    let cleanOs = 'Otros'
    if (e.os.toLowerCase().includes('windows 11')) cleanOs = 'Windows 11'
    else if (e.os.toLowerCase().includes('windows 10')) cleanOs = 'Windows 10'
    else if (e.os.toLowerCase().includes('server')) cleanOs = 'Windows Server'
    else if (e.os.toLowerCase().includes('linux')) cleanOs = 'Linux'
    else if (e.os.toLowerCase().includes('mac') || e.os.toLowerCase().includes('os x')) cleanOs = 'macOS'
    
    osCount[cleanOs] = (osCount[cleanOs] || 0) + 1
  })

  // RAM Distribution calculation
  const ramCount: { [key: string]: number } = { '8 GB o menos': 0, '16 GB': 0, '32 GB': 0, '64 GB o más': 0 }
  equipos.forEach(e => {
    const total = e.ram_details?.total_gb || 0
    if (total <= 8) ramCount['8 GB o menos']++
    else if (total <= 16) ramCount['16 GB']++
    else if (total <= 32) ramCount['32 GB']++
    else ramCount['64 GB o más']++
  })

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
        <div>
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider block">Panel de Inquilino</span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 mt-0.5">{tenantName}</h2>
          <p className="text-sm text-slate-400">Auditoría e inventario físico de las computadoras conectadas de la empresa.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'inventory' 
                ? 'bg-slate-800 text-violet-400 shadow-sm' 
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            Inventario
          </button>
          <button 
            onClick={() => setActiveTab('agent')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'agent' 
                ? 'bg-slate-800 text-violet-400 shadow-sm' 
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <Download className="h-4 w-4" />
            Descargar Agente
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Computers */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-black/10 group">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Equipos Totales</span>
            <span className="text-3xl font-extrabold text-slate-200 mt-1 block">{totalComputers}</span>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
            <Monitor className="h-6 w-6 text-indigo-400" />
          </div>
        </div>

        {/* Avg RAM */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-black/10 group">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">RAM Promedio</span>
            <span className="text-3xl font-extrabold text-slate-200 mt-1 block">{avgRam} GB</span>
          </div>
          <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
            <Layers className="h-6 w-6 text-violet-400" />
          </div>
        </div>

        {/* Total Storage */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-black/10 group">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Almacenamiento Total</span>
            <span className="text-3xl font-extrabold text-slate-200 mt-1 block">{(totalStorage / 1024).toFixed(2)} TB</span>
          </div>
          <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
            <HardDrive className="h-6 w-6 text-teal-400" />
          </div>
        </div>

        {/* Active Users */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-black/10 group">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Último Reporte</span>
            <span className="text-sm font-extrabold text-emerald-400 mt-3 block flex items-center gap-1.5 leading-none">
              <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
              Sistemas Online
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
        </div>

      </div>

      {/* Distribution Charts */}
      {totalComputers > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OS Distribution */}
          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-300 mb-4">Distribución de Sistemas Operativos</h3>
            <div className="space-y-4">
              {Object.entries(osCount).map(([os, count]) => {
                const percent = Math.round((count / totalComputers) * 100)
                return (
                  <div key={os} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold">{os}</span>
                      <span className="text-slate-500">{count} equipo(s) ({percent}%)</span>
                    </div>
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RAM Capacity Distribution */}
          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-300 mb-4">Capacidad de Memoria RAM</h3>
            <div className="space-y-4">
              {Object.entries(ramCount).map(([ramLabel, count]) => {
                const percent = totalComputers > 0 ? Math.round((count / totalComputers) * 100) : 0
                return (
                  <div key={ramLabel} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold">{ramLabel}</span>
                      <span className="text-slate-500">{count} equipo(s) ({percent}%)</span>
                    </div>
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Split view for Groups Sidebar and Main Asset Table */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar for Groups */}
        <div className="w-full md:w-64 shrink-0 space-y-4">
          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Filtro por Grupos</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setSelectedFilterGroup('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${
                    selectedFilterGroup === 'all' 
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span>Todos los equipos</span>
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">{totalComputers}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setSelectedFilterGroup('unassigned')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${
                    selectedFilterGroup === 'unassigned' 
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span>Sin asignar</span>
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">
                    {equipos.filter(e => !e.group_id).length}
                  </span>
                </button>
              </li>
              {groups.map(group => {
                const count = equipos.filter(e => e.group_id === group.id).length
                return (
                  <li key={group.id} className="flex items-center gap-1 group/item">
                    <button
                      onClick={() => setSelectedFilterGroup(group.id)}
                      className={`flex-1 w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${
                        selectedFilterGroup === group.id 
                          ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="truncate pr-2">{group.name}</span>
                      <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full">{count}</span>
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (confirm(`¿Estás seguro de eliminar el grupo "${group.name}"? Los equipos volverán a estar "Sin asignar".`)) {
                          const res = await deleteEquipoGroup(group.id)
                          if (res?.error) alert(res.error)
                          if (selectedFilterGroup === group.id) setSelectedFilterGroup('all')
                        }
                      }}
                      className="opacity-0 group-hover/item:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                      title="Eliminar grupo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="mt-4 pt-4 border-t border-slate-800">
              {isCreatingGroup ? (
                <form
                  ref={groupFormRef}
                  action={async (formData) => {
                    setIsCreatingGroup(true)
                    const res = await createEquipoGroup(
                      formData.get('name') as string,
                      formData.get('description') as string
                    )
                    if (res?.error) {
                      alert(res.error)
                      setIsCreatingGroup(false)
                    } else {
                      setNewGroupName('')
                      setIsCreatingGroup(false)
                      groupFormRef.current?.reset()
                    }
                  }}
                  className="space-y-2 animate-fade-in"
                >
                  <input
                    type="text"
                    name="name"
                    placeholder="Nombre del Grupo"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 text-xs"
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!newGroupName.trim()}
                      className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingGroup(false)
                        setNewGroupName('')
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreatingGroup(true)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Crear Nuevo Grupo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Asset Table */}
        <div className="flex-1 backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/10">
          
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-200">Equipos de Cómputo</h3>
              <span className="text-xs text-slate-500">Haz clic en cualquier fila para auditar detalles.</span>
            </div>
            
            <div className="relative w-full xl:w-80 shrink-0">
              <Search className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-slate-500 flex items-center justify-center pointer-events-none" />
              <input
                type="text"
                placeholder="Filtrar por Hostname, CPU, OS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 text-xs"
              />
            </div>
          </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="pb-3 pl-2">Equipo (Hostname)</th>
                <th className="pb-3">Grupo</th>
                <th className="pb-3">Sistema Operativo</th>
                <th className="pb-3">Procesador</th>
                <th className="pb-3 text-center">RAM</th>
                <th className="pb-3 text-center">Almacenamiento</th>
                <th className="pb-3">Último Usuario</th>
                <th className="pb-3 text-right pr-2">Último Reporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm">
              {filteredEquipos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No se encontraron computadoras registradas.
                  </td>
                </tr>
              ) : (
                filteredEquipos.map(e => (
                  <tr 
                    key={e.id} 
                    onClick={() => router.push(`/dashboard/tenant/equipos/${e.id}`)}
                    className="hover:bg-slate-900/20 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 pl-2 font-bold text-slate-200 group-hover:text-violet-400 transition-colors">
                      {e.hostname}
                    </td>
                    <td className="py-4 text-xs text-slate-300">
                      {e.equipo_groups ? (
                        <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-700 whitespace-nowrap">
                          {e.equipo_groups.name}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Sin asignar</span>
                      )}
                    </td>
                    <td className="py-4 text-xs text-slate-300">{e.os}</td>
                    <td className="py-4 text-xs text-slate-400 max-w-[180px] truncate" title={e.processor}>
                      {e.processor}
                    </td>
                    <td className="py-4 text-center font-semibold text-xs">
                      {e.ram_details?.total_gb || 0} GB
                    </td>
                    <td className="py-4 text-center font-semibold text-xs text-slate-300">
                      {e.disk_details?.total_gb || 0} GB
                    </td>
                    <td className="py-4 text-xs text-slate-400 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                        {e.last_user}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2 text-xs text-slate-500 font-mono">
                      {new Date(e.updated_at).toLocaleString('es-ES', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
        </div>
        </>
      ) : (
        /* Agent Tab Content */
        <div className="space-y-6 animate-fade-in">
          
          <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 lg:w-2/3 shadow-xl shadow-black/10">
            <h3 className="text-lg font-bold text-slate-200 mb-2">Descargar e Instalar el Agente</h3>
            <p className="text-sm text-slate-400 mb-6">
              Para agregar computadoras a tu inventario, genera un <strong>Token de Instalación</strong> y descarga el agente. Luego, ejecuta el script en cada computadora que desees registrar usando PowerShell como Administrador.
            </p>

            <form 
              ref={formRef}
              action={async (formData) => {
                setIsGeneratingKey(true)
                const res = await generateTenantApiKey(formData.get('name') as string)
                setIsGeneratingKey(false)
                if (res?.error) {
                  alert(res.error)
                } else {
                  setNewKeyName('')
                  formRef.current?.reset()
                }
              }} 
              className="flex gap-3 mb-8"
            >
              <div className="flex-1 relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  name="name"
                  placeholder="Ej: Servidor Sucursal Norte"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isGeneratingKey}
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isGeneratingKey ? (
                  <Activity className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Generar Token
              </button>
            </form>

            <h4 className="text-sm font-semibold text-slate-300 mb-4">Tokens de Instalación Activos</h4>
            <div className="space-y-3">
              {apiKeys.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No has generado ningún token de instalación todavía.</p>
              ) : (
                apiKeys.map(key => (
                  <div key={key.id} className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between group">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-200 text-sm">{key.name}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                          {new Date(key.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-slate-400 select-all">
                        {key.token}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(key.token, key.id)}
                        className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                        title="Copiar token"
                      >
                        {copiedKeyId === key.id ? (
                          <>
                            <Check className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs text-emerald-400 font-medium">Copiado</span>
                          </>
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      
                      {/* Download Button */}
                      <button
                        onClick={() => handleDownloadAgent(key.token, key.name)}
                        className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors flex items-center gap-2 border border-indigo-500/20"
                        title="Descargar Agente con este token"
                      >
                        <Download className="h-4 w-4" />
                        <span className="text-xs font-semibold">Descargar Agente</span>
                      </button>

                      <form action={async () => {
                        if(confirm('¿Eliminar este token? Los equipos que lo usen dejarán de enviar reportes.')) {
                          await deleteTenantApiKey(key.id)
                        }
                      }}>
                        <button
                          type="submit"
                          className="p-2 text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-2"
                          title="Eliminar token"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
