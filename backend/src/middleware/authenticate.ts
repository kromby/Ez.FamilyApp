import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  familyId?: string | null;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  // Also accept access_token query param (used by SignalR client)
  const queryToken = req.query.access_token as string | undefined;

  let token: string;
  if (header?.startsWith('Bearer ')) {
    token = header.slice(7);
  } else if (queryToken) {
    token = queryToken;
  } else {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; familyId: string | null };
    req.userId = payload.userId;
    req.familyId = payload.familyId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
