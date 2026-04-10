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

/** Filtra um objeto mantendo apenas as chaves permitidas */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pick(obj: Record<string, any>, keys: string[]): Record<string, any> {
  const result: Record<string, any> = {}
  for (const k of keys) {
    if (k in obj) result[k] = obj[k]
  }
  return result
}

export function handleError(e: unknown) {
  if (e instanceof AuthError) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (process.env.NODE_ENV === 'development') console.error(e)
  return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
}
