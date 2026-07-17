'use client'

import { useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search,
  FolderTree,
  Plus,
  Trash2,
  HardDrive
} from 'lucide-react'
import { createEquipoGroup, deleteEquipoGroup } from '../actions'
import { Equipo, EquipoGroup } from '../tenant-dashboard'

interface GroupsManagerProps {
  initialEquipos: Equipo[]
  initialGroups: EquipoGroup[]
  tenantName: string
}

export default function GroupsManager({ initialEquipos, initialGroups, tenantName }: GroupsManagerProps) {
  const [equipos] = useState<Equipo[]>(initialEquipos)
  const [groups, setGroups] = useState<EquipoGroup[]>(initialGroups)
  const [selectedFilterGroup, setSelectedFilterGroup] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  // Group state
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const groupFormRef = useRef<HTMLFormElement>(null)

  // Filter Logic
  const filteredEquipos = useMemo(() => {
    return equipos.filter(eq => {
      // 1. Group Filter
      if (selectedFilterGroup === 'unassigned') {
        if (eq.group_id) return false
      } else if (selectedFilterGroup !== 'all') {
        if (eq.group_id !== selectedFilterGroup) return false
      }

      // 2. Search Text
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchHostname = eq.hostname.toLowerCase().includes(query)
        const matchOS = eq.os.toLowerCase().includes(query)
        const matchCPU = eq.processor.toLowerCase().includes(query)
        if (!matchHostname && !matchOS && !matchCPU) return false
      }

      return true
    })
  }, [equipos, selectedFilterGroup, searchQuery])

  // Count groups
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    let unassigned = 0
    equipos.forEach(eq => {
      if (eq.group_id) {
        counts[eq.group_id] = (counts[eq.group_id] || 0) + 1
      } else {
        unassigned++
      }
    })
    return { counts, unassigned }
  }, [equipos])

  // Format Helper
  const formatTimeAgo = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `Hace ${days}d`
    if (hours > 0) return `Hace ${hours}h`
    if (minutes > 0) return `Hace ${minutes}m`
    return 'Ahora'
  }

  // Create group
  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      const res = await createEquipoGroup(formData.get('name') as string, null)
      if (res.error) throw new Error(res.error)
      alert("Grupo creado con éxito.")
      setNewGroupName('')
      setIsCreatingGroup(false)
      
      // Update local state instead of full reload for speed
      if ('group' in res && res.group) {
        setGroups([...groups, res.group as EquipoGroup])
      } else {
        router.refresh()
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert("Error: " + err.message)
      } else {
        alert("Error desconocido.")
      }
    }
  }

  // Delete group
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`¿Estás seguro de eliminar el grupo "${groupName}"?\nLos equipos asociados quedarán sin asignar.`)) {
      return
    }
    try {
      const res = await deleteEquipoGroup(groupId)
      if (res.error) throw new Error(res.error)
      // Update local state
      setGroups(groups.filter(g => g.id !== groupId))
      if (selectedFilterGroup === groupId) {
        setSelectedFilterGroup('all')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert("Error: " + err.message)
      } else {
        alert("Error desconocido.")
      }
    }
  }

  return (
    <div className="space-y-8 min-w-0">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderTree className="h-5 w-5 text-teal-500" />
            <h1 className="text-[10px] font-bold tracking-widest text-teal-500 uppercase">Gestor de Grupos</h1>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">{tenantName}</h2>
          <p className="text-sm text-slate-400 mt-1">
            Administra los grupos de equipos y asigna computadoras a cada uno.
          </p>
        </div>
      </div>

      {/* Equipment List with Horizontal Group Filters */}
      <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/10">
        
        {/* HORIZONTAL GROUP FILTERS */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <button
            onClick={() => setSelectedFilterGroup('all')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              selectedFilterGroup === 'all'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            Todos los equipos
            <span className="bg-slate-950/50 px-1.5 py-0.5 rounded text-[10px]">{equipos.length}</span>
          </button>
          <button
            onClick={() => setSelectedFilterGroup('unassigned')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              selectedFilterGroup === 'unassigned'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            Sin asignar
            <span className="bg-slate-950/50 px-1.5 py-0.5 rounded text-[10px]">{groupCounts.unassigned}</span>
          </button>
          
          <div className="w-px h-6 bg-slate-800 shrink-0 mx-1"></div>

          {groups.map(g => {
            const count = groupCounts.counts[g.id] || 0
            return (
              <div key={g.id} className="relative group/groupbtn shrink-0 flex items-center">
                <button
                  onClick={() => setSelectedFilterGroup(g.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedFilterGroup === g.id
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  {g.name}
                  <span className="bg-slate-950/50 px-1.5 py-0.5 rounded text-[10px]">{count}</span>
                </button>
                <button 
                  onClick={() => handleDeleteGroup(g.id, g.name)}
                  className="absolute -top-1 -right-1 p-0.5 bg-rose-500/10 text-rose-400 rounded-full opacity-0 group-hover/groupbtn:opacity-100 transition-opacity border border-rose-500/20 hover:bg-rose-500 hover:text-white"
                  title="Eliminar grupo"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )
          })}

          <div className="w-px h-6 bg-slate-800 shrink-0 mx-1"></div>

          {isCreatingGroup ? (
            <form ref={groupFormRef} onSubmit={handleCreateGroup} className="flex items-center gap-2 shrink-0 animate-fade-in ml-1">
              <input 
                type="text" 
                name="name"
                placeholder="Nombre del grupo..." 
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-40 bg-slate-950/50 border border-slate-700/50 rounded-lg px-2.5 py-1 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                required
              />
              <button 
                type="submit"
                disabled={!newGroupName.trim()}
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                Guardar
              </button>
              <button 
                type="button"
                onClick={() => {
                  setIsCreatingGroup(false)
                  setNewGroupName('')
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreatingGroup(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 border border-dashed border-slate-700 hover:border-violet-500/50 transition-all duration-200 shrink-0 ml-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Crear Grupo
            </button>
          )}
        </div>
          
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-200">
                {selectedFilterGroup === 'all' 
                  ? 'Todos los Equipos' 
                  : selectedFilterGroup === 'unassigned' 
                    ? 'Equipos Sin Asignar' 
                    : `Equipos en: ${groups.find(g => g.id === selectedFilterGroup)?.name || 'Desconocido'}`}
              </h3>
              <span className="text-xs text-slate-500">Mostrando {filteredEquipos.length} equipo(s).</span>
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
                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-500 bg-slate-900/30">
                  <th className="p-4 font-bold rounded-tl-xl">Equipo <br/><span className="text-slate-600 font-normal">(Hostname)</span></th>
                  <th className="p-4 font-bold">Grupo</th>
                  <th className="p-4 font-bold">Sistema Operativo</th>
                  <th className="p-4 font-bold">Procesador</th>
                  <th className="p-4 font-bold">RAM</th>
                  <th className="p-4 font-bold">Almacenamiento</th>
                  <th className="p-4 font-bold">Último Reporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredEquipos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                      No hay equipos registrados en este grupo o que coincidan con tu búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredEquipos.map((eq) => (
                    <tr 
                      key={eq.id} 
                      className="hover:bg-slate-800/20 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/dashboard/tenant/equipos/${eq.id}`)}
                    >
                      <td className="p-4">
                        <div className="font-bold text-slate-200 group-hover:text-violet-400 transition-colors text-sm">{eq.hostname}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[120px]" title={eq.domain || 'WORKGROUP'}>{eq.domain || 'WORKGROUP'}</div>
                      </td>
                      <td className="p-4">
                        {eq.equipo_groups ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/80 border border-slate-700 text-slate-300">
                            {eq.equipo_groups.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-500/10 border border-rose-500/20 text-rose-400/80">
                            Sin grupo
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-slate-300 font-medium truncate max-w-[150px]" title={eq.os}>{eq.os}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-slate-400 truncate max-w-[180px]" title={eq.processor}>{eq.processor}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-200 text-xs">{eq.ram_details?.total_gb || '?'} GB</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-3 w-3 text-slate-500" />
                          <span className="text-xs font-bold text-slate-200">
                            {eq.disk_details?.total_gb || '?'} GB
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${new Date().getTime() - new Date(eq.updated_at).getTime() < 86400000 ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                          <div className="flex flex-col">
                            <span>{formatTimeAgo(eq.updated_at)}</span>
                            <span className="text-[9px] text-slate-600 uppercase">
                              {new Date(eq.updated_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  )
}
