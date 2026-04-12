import { NextResponse } from 'next/server'
import { getSession } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return NextResponse.json({ user: null }, { status: 401 })

  return NextResponse.json({
    user: { id: user.id, login: user.login, nome: user.nome, email: user.email, plano: user.plano, avatar: user.avatar, isAdmin: user.isAdmin, isSuporte: user.isSuporte, theme: user.theme, welcomeSeen: user.welcomeSeen, createdAt: user.createdAt },
  })
}

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const data = await req.json()
  const allowed = ['nome', 'email', 'avatar', 'theme', 'welcomeSeen'] as const
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key]
  }

  const user = await prisma.user.update({ where: { id: session.userId }, data: update })
  return NextResponse.json({
    user: { id: user.id, login: user.login, nome: user.nome, email: user.email, plano: user.plano, avatar: user.avatar, isAdmin: user.isAdmin, isSuporte: user.isSuporte, theme: user.theme, welcomeSeen: user.welcomeSeen, createdAt: user.createdAt },
  })
}
