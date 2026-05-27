'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { authenticate } from './actions'
import { KeyRound, Mail, Monitor, ShieldAlert, Building2 } from 'lucide-react'

function SubmitButton({ isRegister }: { isRegister: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-900/20"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {isRegister ? 'Registrando...' : 'Iniciando sesión...'}
        </span>
      ) : (
        isRegister ? 'Crear Cuenta' : 'Entrar al Panel'
      )}
    </button>
  )
}

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [state, formAction] = useFormState(authenticate, null)

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black p-4 relative overflow-hidden">
      
      {/* Background visual accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand/Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl mb-4 shadow-inner shadow-violet-500/10">
            <Monitor className="h-10 w-10 text-violet-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-200 via-indigo-100 to-white">
            MFT Inventory
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Plataforma de Control de Inventario de Hardware
          </p>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 shadow-2xl shadow-black/40">
          <h2 className="text-xl font-bold text-slate-200 mb-6">
            {isRegister ? 'Crear Cuenta de Inquilino' : 'Iniciar Sesión'}
          </h2>
          
          <form action={formAction} className="space-y-6">
            <input type="hidden" name="mode" value={isRegister ? 'register' : 'login'} />
            
            {state?.error && (
              <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-sm animate-shake">
                <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
                <span>{state.error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="ejemplo@empresa.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-150 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-150 text-sm"
                />
              </div>
            </div>

            {isRegister && (
              <div className="animate-fade-in">
                <label htmlFor="tenantId" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  ID del Cliente (Tenant ID)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <input
                    id="tenantId"
                    name="tenantId"
                    type="text"
                    required={isRegister}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-150 text-sm font-mono"
                  />
                </div>
                <p className="mt-2 text-[10px] text-slate-500">
                  Ingresa el código proporcionado por tu administrador.
                </p>
              </div>
            )}

            <SubmitButton isRegister={isRegister} />
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              type="button"
              className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              {isRegister 
                ? '¿Ya tienes cuenta? Inicia sesión aquí' 
                : '¿No tienes cuenta? Regístrate usando un ID de cliente'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          MFT Hardware Inventory System © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}
