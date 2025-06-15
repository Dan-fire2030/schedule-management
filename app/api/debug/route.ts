import { NextResponse } from 'next/server'
import { getBaseUrl, getAuthCallbackUrl } from '@/lib/utils/auth'

export async function GET() {
  const vercelUrl = process.env.VERCEL_URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const vercelEnv = process.env.VERCEL
  const nodeEnv = process.env.NODE_ENV
  
  const origin = getBaseUrl()
  const authCallbackUrl = getAuthCallbackUrl()
  
  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      VERCEL_URL: vercelUrl,
      NEXT_PUBLIC_SITE_URL: siteUrl,
      VERCEL: vercelEnv,
      NODE_ENV: nodeEnv,
    },
    origin,
    authCallbackUrl,
    timestamp: new Date().toISOString()
  })
}