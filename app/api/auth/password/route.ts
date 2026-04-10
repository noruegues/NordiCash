import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/jwt'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { atual, nova } = await req.json()
  if (!nova || nova.length < 4) {
    return NextResponse.json({ error: 'Senha muito curta (mínimo 4 caracteres)' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const valid = await bcrypt.compare(atual, user.senhaHash)
  if (!valid) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })

  const senhaHash = await bcrypt.hash(nova, 10)
  await prisma.user.update({ where: { id: session.userId }, data: { senhaHash } })

  return NextResponse.json({ ok: true })
}
