import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../auth/jwt.js'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization')
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing access token' })
  }

  const token = header.slice('Bearer '.length).trim()
  try {
    const payload = verifyAccessToken(token)
    req.user = { userId: payload.sub, username: payload.username }
    return next()
  } catch {
    return res.status(401).json({ error: 'invalid or expired access token' })
  }
}

