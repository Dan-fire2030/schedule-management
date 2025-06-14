import { NextResponse } from 'next/server'
import { getBaseUrl, getAuthCallbackUrl } from '@/lib/utils/auth'

export async function GET() {
  const origin = getBaseUrl()
  
  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    },
    origin,
    authCallbackUrl: getAuthCallbackUrl(),
    timestamp: new Date().toISOString()
  })
}