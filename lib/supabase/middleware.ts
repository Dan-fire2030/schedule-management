import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function updateSession(request: NextRequest) {
  // シンプルなミドルウェア処理
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
}