import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../db/prisma';
import { forbidden, unauthorized } from '../utils/httpError';

export interface AuthUser {
  id: string;
  role: Role;
  fullName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface TokenPayload {
  sub: string;
  role: Role;
}

export const signToken = (userId: string, role: Role): string =>
  jwt.sign({ role } satisfies Omit<TokenPayload, 'sub'>, env.JWT_SECRET, {
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

/**
 * בודק שנשלח Bearer Token תקין, ומזהה את המשתמש לפי ה-Token בלבד.
 * ללא Token / Token לא תקין / משתמש שנמחק → 401.
 */
export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw unauthorized('חסר Token – יש להתחבר למערכת');
  }

  let payload: TokenPayload;
  try {
    payload = jwt.verify(header.slice('Bearer '.length).trim(), env.JWT_SECRET) as TokenPayload;
  } catch {
    throw unauthorized('ה-Token אינו תקין או שפג תוקפו – יש להתחבר מחדש');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, fullName: true },
  });
  if (!user) {
    throw unauthorized('המשתמש לא קיים – יש להתחבר מחדש');
  }

  req.user = user;
  next();
};

/** מאפשר גישה רק לתפקידים שצוינו. אחרת → 403 */
export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) throw forbidden();
    next();
  };

/** מחזיר את המשתמש המחובר (אחרי authenticate) */
export const currentUser = (req: Request): AuthUser => {
  if (!req.user) throw unauthorized();
  return req.user;
};
