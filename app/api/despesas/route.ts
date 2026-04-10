import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, handleError } from '@/lib/api-helpers'

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
    const data = await req.json()
    const despesa = await prisma.despesa.create({ data: { ...data, userId: session.userId } })
    return NextResponse.json(despesa, { status: 201 })
  } catch (e) { return handleError(e) }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth()
    const { id, ...data } = await req.json()
    await prisma.despesa.updateMany({ where: { id, userId: session.userId }, data })
    const updated = await prisma.despesa.findFirst({ where: { id, userId: session.userId } })
    return NextResponse.json(updated)
  } catch (e) { return handleError(e) }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireAuth()
    const { id } = await req.json()
    await prisma.despesa.deleteMany({ where: { id, userId: session.userId } })
    return NextResponse.json({ ok: true })
  } catch (e) { return handleError(e) }
}
