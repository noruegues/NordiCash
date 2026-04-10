import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, handleError, pick } from '@/lib/api-helpers'

const ALLOWED_FIELDS = ['nome', 'tipo', 'valorInicial', 'aporteMensal', 'saldoAtual', 'inicio', 'taxaMensal']

export async function GET() {
  try {
    const session = await requireAuth()
    const investimentos = await prisma.investimento.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(investimentos)
  } catch (e) { return handleError(e) }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    const data = pick(await req.json(), ALLOWED_FIELDS)
    const inv = await prisma.investimento.create({ data: { ...data, userId: session.userId } as any })
    return NextResponse.json(inv, { status: 201 })
  } catch (e) { return handleError(e) }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const { id } = body
    const data = pick(body, ALLOWED_FIELDS)
    await prisma.investimento.updateMany({ where: { id, userId: session.userId }, data })
    const updated = await prisma.investimento.findFirst({ where: { id, userId: session.userId } })
    return NextResponse.json(updated)
  } catch (e) { return handleError(e) }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireAuth()
    const { id } = await req.json()
    await prisma.investimento.deleteMany({ where: { id, userId: session.userId } })
    return NextResponse.json({ ok: true })
  } catch (e) { return handleError(e) }
}
