import bcrypt from 'bcryptjs'
import { Router, type Response } from 'express'
import { User } from '../models/User.js'
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../auth/jwt.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const authRouter = Router()

const REFRESH_COOKIE = 'refresh_token'

function cookieSecure() {
  return String(process.env.COOKIE_SECURE ?? 'false').toLowerCase() === 'true'
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure(),
    path: '/',
  })
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: '/' })
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

authRouter.post('/register', async (req, res) => {
  const body = req.body as Record<string, unknown>
  const username = body.username
  const password = body.password

  if (!isNonEmptyString(username)) return res.status(400).json({ error: 'username is required' })
  if (!isNonEmptyString(password)) return res.status(400).json({ error: 'password is required' })

  const u = username.trim()
  if (u.length < 3) return res.status(400).json({ error: 'username must be at least 3 characters' })
  if (u.length > 30) return res.status(400).json({ error: 'username must be at most 30 characters' })
  if (password.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' })

  const existing = await User.findOne({ username: u }).lean()
  if (existing) return res.status(409).json({ error: 'username already exists' })

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ username: u, passwordHash })

  const accessToken = signAccessToken({ sub: user._id.toString(), username: user.username })
  const refresh = signRefreshToken(user._id.toString())
  user.refreshTokenHash = hashToken(refresh.token)
  await user.save()
  setRefreshCookie(res, refresh.token)

  res.status(201).json({ accessToken, user: { userId: user._id.toString(), username: user.username } })
})

authRouter.post('/login', async (req, res) => {
  const body = req.body as Record<string, unknown>
  const username = body.username
  const password = body.password

  if (!isNonEmptyString(username)) return res.status(400).json({ error: 'username is required' })
  if (!isNonEmptyString(password)) return res.status(400).json({ error: 'password is required' })

  const user = await User.findOne({ username: username.trim() })
  if (!user) return res.status(401).json({ error: 'invalid username or password' })

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'invalid username or password' })

  const accessToken = signAccessToken({ sub: user._id.toString(), username: user.username })
  const refresh = signRefreshToken(user._id.toString())
  user.refreshTokenHash = hashToken(refresh.token)
  await user.save()
  setRefreshCookie(res, refresh.token)

  res.json({ accessToken, user: { userId: user._id.toString(), username: user.username } })
})

authRouter.post('/refresh', async (req, res) => {
  const token = (req as any).cookies?.[REFRESH_COOKIE] as string | undefined
  if (!token) return res.status(401).json({ error: 'missing refresh token' })

  let payload: { sub: string; jti: string }
  try {
    payload = verifyRefreshToken(token)
  } catch {
    return res.status(401).json({ error: 'invalid or expired refresh token' })
  }

  const user = await User.findById(payload.sub)
  if (!user || !user.refreshTokenHash) return res.status(401).json({ error: 'invalid session' })

  const presentedHash = hashToken(token)
  if (presentedHash !== user.refreshTokenHash) return res.status(401).json({ error: 'invalid session' })

  const accessToken = signAccessToken({ sub: user._id.toString(), username: user.username })
  const rotated = signRefreshToken(user._id.toString())
  user.refreshTokenHash = hashToken(rotated.token)
  await user.save()
  setRefreshCookie(res, rotated.token)

  res.json({ accessToken, user: { userId: user._id.toString(), username: user.username } })
})

authRouter.post('/logout', async (req, res) => {
  const token = (req as any).cookies?.[REFRESH_COOKIE] as string | undefined
  if (token) {
    try {
      const payload = verifyRefreshToken(token)
      await User.findByIdAndUpdate(payload.sub, { $unset: { refreshTokenHash: 1 } })
    } catch {
      // ignore
    }
  }
  clearRefreshCookie(res)
  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user })
})

