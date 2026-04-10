import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/jwt'

export async function POST(req: Request) {
  try {
    const { login, senha, nome, email } = await req.json()

    if (!login || !senha || !nome) {
      return NextResponse.json({ error: 'Campos obrigatórios: login, senha, nome' }, { status: 400 })
    }

    const exists = await prisma.user.findUnique({ where: { login } })
    if (exists) {
      return NextResponse.json({ error: 'Login já existe' }, { status: 409 })
    }

    const senhaHash = await bcrypt.hash(senha, 10)
    const user = await prisma.user.create({
      data: { login, senhaHash, nome, email, plano: 'Free' },
    })

    const token = signToken({ userId: user.id, login: user.login, isAdmin: user.isAdmin })

    const res = NextResponse.json({
      user: { id: user.id, login: user.login, nome: user.nome, email: user.email, plano: user.plano, isAdmin: user.isAdmin, theme: user.theme, welcomeSeen: user.welcomeSeen, createdAt: user.createdAt },
    })
    res.cookies.set('token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' })
    return res
  } catch (e: any) {
    console.error('Signup error:', e)
    return NextResponse.json({ error: e.message || 'Erro interno' }, { status: 500 })
  }
}
