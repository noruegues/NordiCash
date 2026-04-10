import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/jwt'

// GET: avisos não lidos pelo usuário atual
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json([])

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return NextResponse.json([])

  const avisos = await prisma.aviso.findMany({
    where: {
      ativo: true,
      OR: [
        { planoAlvo: null },
        { planoAlvo: user.plano },
      ],
      NOT: {
        lidos: { some: { userId: session.userId } },
      },
    },
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json(avisos)
}

// POST: marcar aviso como lido
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { avisoId } = await req.json()
  if (!avisoId) return NextResponse.json({ error: 'avisoId obrigatório' }, { status: 400 })

  await prisma.avisoLido.upsert({
    where: { avisoId_userId: { avisoId, userId: session.userId } },
    update: {},
    create: { avisoId, userId: session.userId },
  })

  return NextResponse.json({ ok: true })
}
