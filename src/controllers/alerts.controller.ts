import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth';
import { getLowStockAlerts } from '../services/alerts.service';

export const lowStock = async (req: Request, res: Response) => {
  res.json(await getLowStockAlerts(currentUser(req)));
};
