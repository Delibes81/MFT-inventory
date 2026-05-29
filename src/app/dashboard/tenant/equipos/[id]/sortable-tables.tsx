'use client'

import { useState, useMemo } from 'react'
import { StartupProgram, FileItem } from '../../tenant-dashboard'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

interface SortableTablesProps {
  startupPrograms: StartupProgram[] | null | undefined
  filesList: FileItem[] | null | undefined
}

type SortDirection = 'asc' | 'desc'

export default function SortableTables({ startupPrograms, filesList }: SortableTablesProps) {
  // Sort states
  const [startupSort, setStartupSort] = useState<{ key: keyof StartupProgram; dir: SortDirection } | null>(null)
  const [filesSort, setFilesSort] = useState<{ key: keyof FileItem; dir: SortDirection } | null>(null)

  // Handlers
  const handleSortStartup = (key: keyof StartupProgram) => {
    setStartupSort(current => {
      if (current?.key === key) {
        return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key, dir: 'asc' }
    })
  }

  const handleSortFiles = (key: keyof FileItem) => {
    setFilesSort(current => {
      if (current?.key === key) {
        return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key, dir: 'asc' }
    })
  }

  // Sorted data
  const sortedStartupPrograms = useMemo(() => {
    if (!startupPrograms) return []
    if (!startupSort) return startupPrograms

    return [...startupPrograms].sort((a, b) => {
      const aValue = String(a[startupSort.key]).toLowerCase()
      const bValue = String(b[startupSort.key]).toLowerCase()
      if (aValue < bValue) return startupSort.dir === 'asc' ? -1 : 1
      if (aValue > bValue) return startupSort.dir === 'asc' ? 1 : -1
      return 0
    })
  }, [startupPrograms, startupSort])

  const sortedFilesList = useMemo(() => {
    if (!filesList) return []
    if (!filesSort) return filesList

    return [...filesList].sort((a, b) => {
      let aValue: string | boolean = a[filesSort.key]
      let bValue: string | boolean = b[filesSort.key]
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase()
      if (typeof bValue === 'string') bValue = bValue.toLowerCase()

      if (aValue < bValue) return filesSort.dir === 'asc' ? -1 : 1
      if (aValue > bValue) return filesSort.dir === 'asc' ? 1 : -1
      return 0
    })
  }, [filesList, filesSort])

  // Helper to render sort icon
  const renderSortIcon = (currentSort: { key: string; dir: SortDirection } | null, key: string) => {
    if (currentSort?.key !== key) return <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-50 group-hover:opacity-100 transition-opacity" />
    if (currentSort.dir === 'asc') return <ArrowUp className="h-3 w-3 text-violet-400" />
    return <ArrowDown className="h-3 w-3 text-violet-400" />
  }

  return (
    <div className="space-y-6">
      <details className="group bg-slate-900/30 border border-slate-800/60 rounded-2xl shadow-sm [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer items-center justify-between p-5 border-b border-slate-800 bg-slate-950/20 rounded-t-2xl">
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Programas de Arranque <span className="text-slate-500 ml-2 text-xs bg-slate-800 px-2 py-1 rounded-full">{startupPrograms?.length || 0} items</span>
          </h4>
          <span className="text-slate-500 transition group-open:rotate-180">
            <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
          </span>
        </summary>
        <div className="p-0 overflow-x-auto max-h-[600px] overflow-y-auto">
          {sortedStartupPrograms.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5 cursor-pointer hover:bg-slate-800/50 group select-none transition-colors" onClick={() => handleSortStartup('name')}>
                    <div className="flex items-center gap-2">Nombre {renderSortIcon(startupSort, 'name')}</div>
                  </th>
                  <th className="py-3 px-5 cursor-pointer hover:bg-slate-800/50 group select-none transition-colors" onClick={() => handleSortStartup('command')}>
                    <div className="flex items-center gap-2">Comando {renderSortIcon(startupSort, 'command')}</div>
                  </th>
                  <th className="py-3 px-5 cursor-pointer hover:bg-slate-800/50 group select-none transition-colors" onClick={() => handleSortStartup('location')}>
                    <div className="flex items-center gap-2">Ubicación {renderSortIcon(startupSort, 'location')}</div>
                  </th>
                  <th className="py-3 px-5 cursor-pointer hover:bg-slate-800/50 group select-none transition-colors" onClick={() => handleSortStartup('user')}>
                    <div className="flex items-center gap-2">Usuario {renderSortIcon(startupSort, 'user')}</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {sortedStartupPrograms.map((prog, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-5 font-medium text-slate-200">{prog.name}</td>
                    <td className="py-3 px-5 font-mono text-xs text-slate-400 max-w-[300px] truncate" title={prog.command}>{prog.command}</td>
                    <td className="py-3 px-5 text-slate-400">{prog.location}</td>
                    <td className="py-3 px-5 text-slate-400">{prog.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              No se encontraron programas de arranque o no están disponibles.
            </div>
          )}
        </div>
      </details>

      <details className="group bg-slate-900/30 border border-slate-800/60 rounded-2xl shadow-sm [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer items-center justify-between p-5 border-b border-slate-800 bg-slate-950/20 rounded-t-2xl">
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Archivos y Carpetas en C:\ <span className="text-slate-500 ml-2 text-xs bg-slate-800 px-2 py-1 rounded-full">{filesList?.length || 0} items</span>
          </h4>
          <span className="text-slate-500 transition group-open:rotate-180">
            <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
          </span>
        </summary>
        <div className="p-0 overflow-x-auto max-h-[600px] overflow-y-auto">
          {sortedFilesList.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5 cursor-pointer hover:bg-slate-800/50 group select-none transition-colors" onClick={() => handleSortFiles('name')}>
                    <div className="flex items-center gap-2">Nombre {renderSortIcon(filesSort, 'name')}</div>
                  </th>
                  <th className="py-3 px-5 cursor-pointer hover:bg-slate-800/50 group select-none transition-colors" onClick={() => handleSortFiles('type')}>
                    <div className="flex items-center gap-2">Tipo {renderSortIcon(filesSort, 'type')}</div>
                  </th>
                  <th className="py-3 px-5 cursor-pointer hover:bg-slate-800/50 group select-none transition-colors" onClick={() => handleSortFiles('hidden')}>
                    <div className="flex items-center gap-2">Oculto {renderSortIcon(filesSort, 'hidden')}</div>
                  </th>
                  <th className="py-3 px-5 cursor-pointer hover:bg-slate-800/50 group select-none transition-colors" onClick={() => handleSortFiles('last_write_time')}>
                    <div className="flex items-center gap-2">Última Modificación {renderSortIcon(filesSort, 'last_write_time')}</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {sortedFilesList.map((file, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-5 font-medium text-slate-200">{file.name}</td>
                    <td className="py-3 px-5 text-slate-400">
                      <span className={`px-2 py-1 rounded-md text-xs ${file.type === 'Folder' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-300'}`}>
                        {file.type}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-slate-400">{file.hidden ? 'Sí' : 'No'}</td>
                    <td className="py-3 px-5 text-slate-400">{file.last_write_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              No se encontraron archivos o no están disponibles.
            </div>
          )}
        </div>
      </details>
    </div>
  )
}
