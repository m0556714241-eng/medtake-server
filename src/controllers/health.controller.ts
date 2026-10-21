import type { Request, Response } from 'express';
import { prisma } from '../db/prisma';

/** בדיקת בריאות – גם השרת וגם החיבור למסד */
export const health = async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'ok', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', database: 'unavailable', time: new Date().toISOString() });
  }
};
