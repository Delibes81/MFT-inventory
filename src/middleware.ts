import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - API collector endpoints (avoid checking/refreshing user sessions on agent POST calls)
     * - Images / vector assets
     */
    '/((?!_next/static|_next/image|favicon.ico|api/collector|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
