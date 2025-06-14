import { NextResponse } from 'next/server'

export async function GET() {
  const vercelUrl = process.env.VERCEL_URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  
  let origin = 'http://localhost:3001'
  if (siteUrl) {
    origin = siteUrl
  } else if (vercelUrl) {
    origin = `https://${vercelUrl}`
  }
  
  const authCallbackUrl = `${origin}/auth/callback`
  
  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      VERCEL_URL: vercelUrl,
      NEXT_PUBLIC_SITE_URL: siteUrl,
    },
    origin,
    authCallbackUrl,
    timestamp: new Date().toISOString()
  })
}