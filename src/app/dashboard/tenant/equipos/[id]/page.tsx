import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { 
  Monitor, 
  Cpu, 
  HardDrive, 
  User, 
  ShieldCheck, 
  FileText,
  ArrowLeft
} from 'lucide-react'
import { 
  Equipo, 
  RAMModule, 
  DiskDrive, 
  StartupProgram, 
  FileItem 
} from '../../tenant-dashboard'

export const dynamic = 'force-dynamic'

export default async function EquipoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user profile to check tenant
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.tenant_id) {
    redirect('/login?error=no-tenant')
  }

  // Fetch the specific equipment
  const { data: equipoData, error: equipoError } = await supabase
    .from('equipos')
    .select('*')
    .eq('id', params.id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (equipoError || !equipoData) {
    redirect('/dashboard/tenant?error=equipo-not-found')
  }

  const selectedEquipo = equipoData as unknown as Equipo

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 border-b border-slate-900 pb-6">
        <Link 
          href="/dashboard/tenant" 
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors border border-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <Monitor className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100 mt-0.5">{selectedEquipo.hostname}</h2>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Ficha técnica detallada</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* General Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dominio</span>
            <span className="text-sm font-semibold text-slate-200 mt-1 flex items-center gap-1.5 truncate" title={selectedEquipo.domain || 'Workgroup'}>
              {selectedEquipo.domain || 'Workgroup'}
            </span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Último Usuario</span>
            <span className="text-sm font-semibold text-slate-200 mt-1 flex items-center gap-1.5 truncate" title={selectedEquipo.last_user}>
              <User className="h-4 w-4 text-slate-400" />
              {selectedEquipo.last_user}
            </span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Fabricante</span>
            <span className="text-sm font-semibold text-slate-200 mt-1 block">{selectedEquipo.manufacturer}</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Modelo</span>
            <span className="text-sm font-semibold text-slate-200 mt-1 block">{selectedEquipo.model}</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Número de Serie</span>
            <span className="text-sm font-mono font-semibold text-slate-200 mt-1 block truncate" title={selectedEquipo.serial_number}>
              {selectedEquipo.serial_number}
            </span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Último Reporte</span>
            <span className="text-sm font-semibold text-indigo-400 mt-1 block">
              {new Date(selectedEquipo.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Hardware Components Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Processor & Memory */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-violet-400" /> CPU & Memoria RAM
            </h4>
            
            <div className="space-y-4">
              <div className="bg-slate-900/30 border border-slate-800/60 p-4 rounded-2xl">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Procesador</span>
                <span className="text-sm text-slate-200 mt-1 block font-medium">{selectedEquipo.processor}</span>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/60 p-4 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Memoria RAM Total</span>
                  <span className="text-sm font-bold text-violet-400">{selectedEquipo.ram_details?.total_gb} GB</span>
                </div>
                <div className="space-y-2">
                  {selectedEquipo.ram_details?.modules?.map((mod: RAMModule, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-300">
                          Slot {idx + 1}: {mod.capacity_gb} GB {mod.memory_type && mod.memory_type !== 'Desconocido' ? mod.memory_type : ''} {mod.form_factor && mod.form_factor !== 'Desconocido' ? mod.form_factor : ''}
                        </span>
                        <span className="text-slate-500 ml-2 block sm:inline mt-1 sm:mt-0 text-xs">
                          {mod.manufacturer} {mod.part_number && mod.part_number !== 'Virtual Memory' ? `(${mod.part_number})` : ''}
                        </span>
                      </div>
                      <span className="text-slate-400 ml-4 font-mono">{mod.speed_mhz > 0 ? `${mod.speed_mhz} MHz` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Storage Disk Units */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-teal-400" /> Unidades de Disco
            </h4>
            
            <div className="bg-slate-900/30 border border-slate-800/60 p-4 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Almacenamiento Total</span>
                <span className="text-sm font-bold text-teal-400">{selectedEquipo.disk_details?.total_gb} GB</span>
              </div>

              <div className="space-y-4">
                {selectedEquipo.disk_details?.drives?.map((drive: DiskDrive, i: number) => {
                  const usedPercent = Math.round((drive.used_space_gb / drive.size_gb) * 100)
                  return (
                    <div key={i} className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-slate-200">
                          Unidad {drive.drive_letter} ({drive.type})
                        </span>
                        <span className="text-slate-400 font-mono text-xs">
                          {drive.used_space_gb} GB / {drive.size_gb} GB
                        </span>
                      </div>
                      
                      {/* Visual space bar */}
                      <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            usedPercent > 85 
                              ? 'bg-rose-500' 
                              : usedPercent > 70 
                                ? 'bg-amber-500' 
                                : 'bg-teal-500'
                          }`} 
                          style={{ width: `${usedPercent}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{usedPercent}% en uso</span>
                        <span>{drive.free_space_gb} GB libres</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Software section */}
        <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl space-y-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            Auditoría de Software y Seguridad
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            {/* Antivirus */}
            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Antivirus Detectado</span>
                <span className="text-slate-200 font-semibold mt-0.5 block">
                  {selectedEquipo.antivirus || 'No se detectó antivirus activo'}
                </span>
              </div>
            </div>
            {/* Office */}
            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <FileText className="h-6 w-6 text-indigo-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Microsoft Office</span>
                <span className="text-slate-200 font-semibold mt-0.5 block">
                  {selectedEquipo.office_version || 'No se detectó Office instalado'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tables for Files and Startup Programs */}
        <div className="space-y-6">
          <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-800 bg-slate-950/20">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Programas de Arranque <span className="text-slate-500 ml-2 text-xs bg-slate-800 px-2 py-1 rounded-full">{selectedEquipo.startup_programs?.length || 0} items</span>
              </h4>
            </div>
            <div className="p-0 overflow-x-auto">
              {selectedEquipo.startup_programs && selectedEquipo.startup_programs.length > 0 ? (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-5">Nombre</th>
                      <th className="py-3 px-5">Comando</th>
                      <th className="py-3 px-5">Ubicación</th>
                      <th className="py-3 px-5">Usuario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {selectedEquipo.startup_programs.map((prog: StartupProgram, idx: number) => (
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
          </div>

          <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-800 bg-slate-950/20">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Archivos y Carpetas en C:\ <span className="text-slate-500 ml-2 text-xs bg-slate-800 px-2 py-1 rounded-full">{selectedEquipo.files_list?.length || 0} items</span>
              </h4>
            </div>
            <div className="p-0 overflow-x-auto">
              {selectedEquipo.files_list && selectedEquipo.files_list.length > 0 ? (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-5">Nombre</th>
                      <th className="py-3 px-5">Tipo</th>
                      <th className="py-3 px-5">Oculto</th>
                      <th className="py-3 px-5">Última Modificación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {selectedEquipo.files_list.map((file: FileItem, idx: number) => (
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
          </div>
        </div>
      </div>
    </div>
  )
}
