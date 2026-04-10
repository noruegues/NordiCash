import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, handleError, pick } from '@/lib/api-helpers'

const ALLOWED_FIELDS = ['nome', 'banco', 'tipo', 'saldoInicial', 'cor']

export async function GET() {
  try {
    const session = await requireAuth()
    const contas = await prisma.contaBancaria.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(contas)
  } catch (e) { return handleError(e) }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    const data = pick(await req.json(), ALLOWED_FIELDS)
    const conta = await prisma.contaBancaria.create({ data: { ...data, userId: session.userId } as any })
    return NextResponse.json(conta, { status: 201 })
  } catch (e) { return handleError(e) }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const { id } = body
    const data = pick(body, ALLOWED_FIELDS)
    const conta = await prisma.contaBancaria.updateMany({ where: { id, userId: session.userId }, data })
    return NextResponse.json(conta)
  } catch (e) { return handleError(e) }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireAuth()
    const { id } = await req.json()
    await prisma.contaBancaria.deleteMany({ where: { id, userId: session.userId } })
    return NextResponse.json({ ok: true })
  } catch (e) { return handleError(e) }
}
