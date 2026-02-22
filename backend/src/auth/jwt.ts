import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'

export type AccessTokenPayload = {
  sub: string
  username: string
}

export type RefreshTokenPayload = {
  sub: string
  jti: string
}

function mustGetEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v
}

export function signAccessToken(payload: AccessTokenPayload) {
  const secret = mustGetEnv('JWT_ACCESS_SECRET')
  const ttlSeconds = Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900)
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: ttlSeconds })
}

export function signRefreshToken(userId: string) {
  const secret = mustGetEnv('JWT_REFRESH_SECRET')
  const ttlDays = Number(process.env.JWT_REFRESH_TTL_DAYS ?? 30)
  const jti = crypto.randomUUID()
  const token = jwt.sign({ sub: userId, jti } satisfies RefreshTokenPayload, secret, {
    algorithm: 'HS256',
    expiresIn: `${ttlDays}d`,
  })
  return { token, jti }
}

export function verifyAccessToken(token: string) {
  const secret = mustGetEnv('JWT_ACCESS_SECRET')
  return jwt.verify(token, secret) as AccessTokenPayload
}

export function verifyRefreshToken(token: string) {
  const secret = mustGetEnv('JWT_REFRESH_SECRET')
  return jwt.verify(token, secret) as RefreshTokenPayload
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

