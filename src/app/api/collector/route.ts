import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the Collector Agent request
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Create Supabase Admin client (bypasses RLS to query tokens and update data)
    let supabaseAdmin;
    try {
      supabaseAdmin = createAdminClient()
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('Supabase admin client error:', errMsg)
      return NextResponse.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY missing' },
        { status: 500 }
      )
    }

    // Look up the API key to find the corresponding tenant
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('tenant_api_keys')
      .select('tenant_id')
      .eq('token', token)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json(
        { error: 'Invalid agent authorization token' },
        { status: 401 }
      )
    }

    const tenantId = keyData.tenant_id

    // 2. Parse and Validate the payload
    const body = await request.json()
    const {
      hostname,
      domain,
      os,
      processor,
      ram_details,
      disk_details,
      last_user,
      serial_number,
      model,
      manufacturer,
      antivirus,
      office_version,
    } = body

    // Validation checks
    if (
      !hostname ||
      !os ||
      !processor ||
      !ram_details ||
      !disk_details ||
      !last_user ||
      !serial_number ||
      !model ||
      !manufacturer
    ) {
      return NextResponse.json(
        { error: 'Missing required hardware components in payload' },
        { status: 400 }
      )
    }

    // 3. Upsert the hardware specs in public.equipos table
    // Matches constraint: unique_tenant_hostname_serial
    const { data: equipoData, error: upsertError } = await supabaseAdmin
      .from('equipos')
      .upsert(
        {
          tenant_id: tenantId,
          hostname,
          domain: domain || null,
          os,
          processor,
          ram_details,
          disk_details,
          last_user,
          serial_number,
          model,
          manufacturer,
          antivirus: antivirus || null,
          office_version: office_version || null,
        },
        {
          onConflict: 'tenant_id,hostname,serial_number',
        }
      )
      .select()

    if (upsertError) {
      console.error('Database insertion error:', upsertError.message)
      return NextResponse.json(
        { error: 'Database transaction failed', details: upsertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Equipment details updated successfully for ${hostname}`,
      data: equipoData,
    })
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('API Collector general error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: errMsg },
      { status: 500 }
    )
  }
}
