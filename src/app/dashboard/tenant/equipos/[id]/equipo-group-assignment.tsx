'use client'

import { useState } from 'react'
import { assignEquipoToGroup } from '../../actions'
import { Check, Loader2 } from 'lucide-react'
import { EquipoGroup } from '../../tenant-dashboard'

interface EquipoGroupAssignmentProps {
  equipoId: string
  currentGroupId: string | null
  groups: EquipoGroup[]
}

export default function EquipoGroupAssignment({ equipoId, currentGroupId, groups }: EquipoGroupAssignmentProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(currentGroupId || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    const result = await assignEquipoToGroup(equipoId, selectedGroupId === '' ? null : selectedGroupId)
    setIsSaving(false)

    if (result.error) {
      alert(result.error)
    }
  }

  // Only show the save button if the value has changed
  const hasChanged = selectedGroupId !== (currentGroupId || '')

  return (
    <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl shadow-sm space-y-2">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Grupo Asignado</span>
      <div className="flex items-center gap-2">
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="flex-1 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 text-sm p-1.5"
        >
          <option value="">-- Sin asignar --</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        
        {hasChanged && (
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors disabled:opacity-50"
            title="Guardar cambios"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  )
}
