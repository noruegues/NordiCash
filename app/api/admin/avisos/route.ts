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

  const avisos = await prisma.aviso.findMany({
    orderBy: { criadoEm: 'desc' },
    include: {
      _count: { select: { lidos: true } },
      lidos: {
        select: { lidoEm: true, user: { select: { id: true, nome: true, login: true, avatar: true } } },
        orderBy: { lidoEm: 'desc' },
      },
    },
  })

  return NextResponse.json(avisos)
}

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { titulo, mensagem, tipo, planoAlvo } = await req.json()
  if (!titulo || !mensagem) {
    return NextResponse.json({ error: 'Título e mensagem são obrigatórios' }, { status: 400 })
  }

  const aviso = await prisma.aviso.create({
    data: { titulo, mensagem, tipo: tipo || 'info', planoAlvo: planoAlvo || null },
    include: { _count: { select: { lidos: true } } },
  })

  return NextResponse.json(aviso, { status: 201 })
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id, ...data } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const aviso = await prisma.aviso.update({
    where: { id },
    data,
    include: { _count: { select: { lidos: true } } },
  })

  return NextResponse.json(aviso)
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  await prisma.aviso.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
