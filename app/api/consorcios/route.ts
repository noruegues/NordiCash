import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, handleError } from '@/lib/api-helpers'

export async function GET() {
  try {
    const session = await requireAuth()
    const consorcios = await prisma.consorcio.findMany({
      where: { userId: session.userId },
      include: { parcelas: { orderBy: { numero: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(consorcios)
  } catch (e) { return handleError(e) }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth()
    const { parcelas, ...data } = await req.json()
    const consorcio = await prisma.consorcio.create({
      data: {
        ...data,
        userId: session.userId,
        parcelas: parcelas ? { create: parcelas } : undefined,
      },
      include: { parcelas: true },
    })
    return NextResponse.json(consorcio, { status: 201 })
  } catch (e) { return handleError(e) }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth()
    const { id, parcelas, ...data } = await req.json()
    await prisma.consorcio.updateMany({ where: { id, userId: session.userId }, data })
    if (parcelas) {
      await prisma.parcelaConsorcio.deleteMany({ where: { consorcioId: id } })
      await prisma.parcelaConsorcio.createMany({ data: parcelas.map((p: any) => ({ ...p, consorcioId: id })) })
    }
    const updated = await prisma.consorcio.findFirst({ where: { id, userId: session.userId }, include: { parcelas: { orderBy: { numero: 'asc' } } } })
    return NextResponse.json(updated)
  } catch (e) { return handleError(e) }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireAuth()
    const { id } = await req.json()
    await prisma.consorcio.deleteMany({ where: { id, userId: session.userId } })
    return NextResponse.json({ ok: true })
  } catch (e) { return handleError(e) }
}
