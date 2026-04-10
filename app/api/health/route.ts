import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const count = await prisma.user.count()
    return NextResponse.json({
      ok: true,
      db: 'connected',
      users: count,
      hasDbUrl: !!process.env.DATABASE_URL,
      dbUrlPrefix: process.env.DATABASE_URL?.slice(0, 30) + '...',
    })
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e.message,
      code: e.code,
      hasDbUrl: !!process.env.DATABASE_URL,
      dbUrlPrefix: process.env.DATABASE_URL?.slice(0, 30) + '...',
    }, { status: 500 })
  }
}
