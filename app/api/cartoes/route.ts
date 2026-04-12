import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, handleError, pick } from '@/lib/api-helpers'

const ALLOWED_FIELDS = ['nome', 'banco', 'bandeira', 'cor', 'limite', 'diaVencimento', 'faturaPagaMes', 'isDefault', 'ordem']

export async function GET() {
  try {
    const session = await requireAuth()
    const cartoes = await prisma.cartao.findMany({ where: { userId: session.userId }, orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }] })
    return NextResponse.json(cartoes)
  } catch (e) { return handleError(e) }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    const data = pick(await req.json(), ALLOWED_FIELDS)
    const cartao = await prisma.cartao.create({ data: { ...data, userId: session.userId } as any })
    return NextResponse.json(cartao, { status: 201 })
  } catch (e) { return handleError(e) }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()

    // Marcar como default: limpa os outros e marca este
    if (body.setDefault && body.id) {
      await prisma.$transaction([
        prisma.cartao.updateMany({ where: { userId: session.userId }, data: { isDefault: false } }),
        prisma.cartao.updateMany({ where: { id: body.id, userId: session.userId }, data: { isDefault: true } }),
      ])
      return NextResponse.json({ ok: true })
    }

    // Reordenar cartões
    if (body.reorder && Array.isArray(body.ids)) {
      await prisma.$transaction(
        body.ids.map((id: string, i: number) =>
          prisma.cartao.updateMany({ where: { id, userId: session.userId }, data: { ordem: i } })
        )
      )
      return NextResponse.json({ ok: true })
    }

    const { id } = body
    const data = pick(body, ALLOWED_FIELDS)
    await prisma.cartao.updateMany({ where: { id, userId: session.userId }, data })
    const updated = await prisma.cartao.findFirst({ where: { id, userId: session.userId } })
    return NextResponse.json(updated)
  } catch (e) { return handleError(e) }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireAuth()
    const { id } = await req.json()
    await prisma.cartao.deleteMany({ where: { id, userId: session.userId } })
    return NextResponse.json({ ok: true })
  } catch (e) { return handleError(e) }
}
