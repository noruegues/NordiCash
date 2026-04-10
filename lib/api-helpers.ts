import { NextResponse } from 'next/server'
import { getSession } from '@/lib/jwt'

export async function requireAuth() {
  const session = await getSession()
  if (!session) throw new AuthError()
  return session
}

export class AuthError extends Error {
  constructor() { super('Não autorizado') }
}

export function handleError(e: unknown) {
  if (e instanceof AuthError) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  console.error(e)
  return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
}
