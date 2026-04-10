import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/jwt'

export async function POST(req: Request) {
  const { login, senha } = await req.json()

  if (!login || !senha) {
    return NextResponse.json({ error: 'Login e senha obrigatórios' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { login } })
  if (!user) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  const valid = await bcrypt.compare(senha, user.senhaHash)
  if (!valid) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  const token = signToken({ userId: user.id, login: user.login, isAdmin: user.isAdmin })

  const res = NextResponse.json({
    user: { id: user.id, login: user.login, nome: user.nome, email: user.email, plano: user.plano, avatar: user.avatar, isAdmin: user.isAdmin, theme: user.theme, welcomeSeen: user.welcomeSeen, createdAt: user.createdAt },
  })
  res.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' })
  return res
}
