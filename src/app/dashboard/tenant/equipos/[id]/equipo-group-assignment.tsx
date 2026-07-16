'use client'

import { useState } from 'react'
import { assignEquipoToGroup } from '../../actions'
import { Loader2 } from 'lucide-react'
import { EquipoGroup } from '../../tenant-dashboard'

interface EquipoGroupAssignmentProps {
  equipoId: string
  currentGroupId: string | null
  groups: EquipoGroup[]
}

export default function EquipoGroupAssignment({ equipoId, currentGroupId, groups }: EquipoGroupAssignmentProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(currentGroupId || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = async (newGroupId: string) => {
    setSelectedGroupId(newGroupId)
    setIsSaving(true)
    const result = await assignEquipoToGroup(equipoId, newGroupId === '' ? null : newGroupId)
    setIsSaving(false)

    if (result.error) {
      alert(result.error)
      // Revert state on error
      setSelectedGroupId(currentGroupId || '')
    }
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl shadow-sm space-y-2 relative">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Grupo Asignado</span>
      <div className="flex items-center gap-2">
        <select
          value={selectedGroupId}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isSaving}
          className="flex-1 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 text-sm p-1.5 disabled:opacity-50"
        >
          <option value="">-- Sin asignar --</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        
        {isSaving && (
          <div className="absolute right-6 top-1/2 mt-1">
            <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
          </div>
        )}
      </div>
    </div>
  )
}

