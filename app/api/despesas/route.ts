import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, handleError, pick } from '@/lib/api-helpers'

const ALLOWED_FIELDS = ['descricao', 'categoria', 'valor', 'data', 'mesRef', 'forma', 'contaId', 'cartaoId', 'recorrencia', 'recorrenciaMeses', 'groupId', 'emprestado', 'pago']

export async function GET() {
  try {
    const session = await requireAuth()
    const despesas = await prisma.despesa.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(despesas)
  } catch (e) { return handleError(e) }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    const raw = await req.json()
    const data = pick(raw, ALLOWED_FIELDS)
    const despesa = await prisma.despesa.create({ data: { ...data, userId: session.userId } as any })
    return NextResponse.json(despesa, { status: 201 })
  } catch (e) { return handleError(e) }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()

    // Bulk update: { bulk: true, cartaoId, mesRef, data: { pago: true } }
    if (body.bulk && body.cartaoId && body.mesRef) {
      await prisma.despesa.updateMany({
        where: { userId: session.userId, cartaoId: body.cartaoId, mesRef: body.mesRef },
        data: body.data,
      })
      return NextResponse.json({ ok: true })
    }

    const { id } = body
    const data = pick(body, ALLOWED_FIELDS)
    await prisma.despesa.updateMany({ where: { id, userId: session.userId }, data })
    const updated = await prisma.despesa.findFirst({ where: { id, userId: session.userId } })
    return NextResponse.json(updated)
  } catch (e) { return handleError(e) }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireAuth()
    const { id, groupId } = await req.json()

    if (groupId) {
      await prisma.despesa.deleteMany({ where: { groupId, userId: session.userId } })
    } else {
      await prisma.despesa.deleteMany({ where: { id, userId: session.userId } })
    }

    return NextResponse.json({ ok: true })
  } catch (e) { return handleError(e) }
}
