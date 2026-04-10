import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/jwt'

async function requireAdmin() {
  const session = await getSession()
  if (!session) return null
  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user?.isAdmin) return null
  return user
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, login: true, nome: true, email: true, plano: true,
      isAdmin: true, createdAt: true, welcomeSeen: true,
      _count: { select: { contas: true, receitas: true, despesas: true, cartoes: true, investimentos: true, consorcios: true, bens: true } },
    },
  })

  return NextResponse.json(users)
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { userId, plano, isAdmin } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (plano !== undefined) update.plano = plano
  if (isAdmin !== undefined) update.isAdmin = isAdmin

  const user = await prisma.user.update({ where: { id: userId }, data: update })
  return NextResponse.json({ id: user.id, login: user.login, nome: user.nome, email: user.email, plano: user.plano, isAdmin: user.isAdmin })
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })
  if (userId === admin.id) return NextResponse.json({ error: 'Não pode deletar a si mesmo' }, { status: 400 })

  await prisma.user.delete({ where: { id: userId } })
  return NextResponse.json({ ok: true })
}
