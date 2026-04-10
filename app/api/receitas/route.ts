import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, handleError, pick } from '@/lib/api-helpers'

const ALLOWED_FIELDS = ['fonte', 'categoria', 'valor', 'contaId', 'mesRef', 'recorrencia']

export async function GET() {
  try {
    const session = await requireAuth()
    const receitas = await prisma.receita.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(receitas)
  } catch (e) { return handleError(e) }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    const data = pick(await req.json(), ALLOWED_FIELDS)
    const receita = await prisma.receita.create({ data: { ...data, userId: session.userId } as any })
    return NextResponse.json(receita, { status: 201 })
  } catch (e) { return handleError(e) }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const { id } = body
    const data = pick(body, ALLOWED_FIELDS)
    await prisma.receita.updateMany({ where: { id, userId: session.userId }, data })
    const updated = await prisma.receita.findFirst({ where: { id, userId: session.userId } })
    return NextResponse.json(updated)
  } catch (e) { return handleError(e) }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireAuth()
    const { id } = await req.json()
    await prisma.receita.deleteMany({ where: { id, userId: session.userId } })
    return NextResponse.json({ ok: true })
  } catch (e) { return handleError(e) }
}
