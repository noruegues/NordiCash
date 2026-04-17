import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, handleError, pick } from '@/lib/api-helpers'

const ALLOWED_FIELDS = ['bem', 'administradora', 'valorCarta', 'prazoMeses', 'parcelaCheia', 'taxaAdmin', 'inicio', 'diaVencimento', 'debitoAutomatico', 'contaId', 'contemplado', 'pagamentoReduzido', 'percentualReducao']
const PARCELA_FIELDS = ['numero', 'mesRef', 'valor', 'cheiaSimulada', 'paga']

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
    const body = await req.json()
    const data = pick(body, ALLOWED_FIELDS)
    const parcelas = body.parcelas?.map((p: any) => pick(p, PARCELA_FIELDS))
    const consorcio = await prisma.consorcio.create({
      data: {
        ...data,
        userId: session.userId,
        parcelas: parcelas ? { create: parcelas } : undefined,
      } as any,
      include: { parcelas: true },
    })
    return NextResponse.json(consorcio, { status: 201 })
  } catch (e) { return handleError(e) }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const { id } = body
    const data = pick(body, ALLOWED_FIELDS)
    if (body.parcelas) {
      const cleanParcelas = body.parcelas.map((p: any) => ({ ...pick(p, PARCELA_FIELDS), consorcioId: id }))
      await prisma.$transaction([
        prisma.consorcio.updateMany({ where: { id, userId: session.userId }, data }),
        prisma.parcelaConsorcio.deleteMany({ where: { consorcioId: id } }),
        prisma.parcelaConsorcio.createMany({ data: cleanParcelas }),
      ])
    } else {
      await prisma.consorcio.updateMany({ where: { id, userId: session.userId }, data })
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
