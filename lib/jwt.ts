import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

function getSecret(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET environment variable is required')
  return s
}

export function signToken(payload: { userId: string; login: string; isAdmin: boolean; isSuporte: boolean }) {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' })
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, getSecret()) as unknown as { userId: string; login: string; isAdmin: boolean; isSuporte: boolean }
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  return verifyToken(token)
}
