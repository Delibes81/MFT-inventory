'use client'

import { useState } from 'react'
import { updateEquipoNotes } from '../../actions'
import { Edit3, Check, X, Loader2 } from 'lucide-react'

interface EquipoNotesProps {
  equipoId: string
  initialNotes: string | null
}

export default function EquipoNotes({ equipoId, initialNotes }: EquipoNotesProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    const result = await updateEquipoNotes(equipoId, notes)
    setIsSaving(false)

    if (result.error) {
      alert(result.error)
    } else {
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setNotes(initialNotes || '')
    setIsEditing(false)
  }

  return (
    <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          Notas del Equipo
        </h4>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-xs flex items-center gap-1.5 text-violet-400 hover:text-violet-300 font-semibold transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Editar
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCancel}
              disabled={isSaving}
              className="text-xs flex items-center gap-1 text-slate-400 hover:text-slate-300 font-semibold transition-colors disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Guardar
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Agrega notas o comentarios sobre este equipo..."
          className="w-full min-h-[120px] bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm p-3 resize-y"
        />
      ) : (
        <div className="text-sm text-slate-300 whitespace-pre-wrap min-h-[80px]">
          {initialNotes ? initialNotes : (
            <span className="text-slate-500 italic">No hay notas registradas para este equipo.</span>
          )}
        </div>
      )}
    </div>
  )
}
