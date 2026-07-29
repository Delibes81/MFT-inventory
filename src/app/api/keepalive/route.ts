import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Ensure this route is evaluated dynamically for every request
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Perform a lightweight query to keep the database active
    // We select a single row from a known table
    const { error } = await supabase.from('tenants').select('id').limit(1)

    if (error) {
      console.error('Keepalive ping failed:', error.message)
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      status: 'ok', 
      message: 'Database ping successful', 
      timestamp: new Date().toISOString() 
    })
  } catch (error: any) {
    console.error('Keepalive ping error:', error)
    return NextResponse.json(
      { status: 'error', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
