import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth';
import { idParamSchema, validate } from '../schemas/common';
import { markIntakeSchema } from '../schemas/intake.schema';
import * as intakesService from '../services/intakes.service';

export const mark = async (req: Request, res: Response) => {
  const input = validate(markIntakeSchema, req.body);
  res.status(201).json(await intakesService.markTaken(currentUser(req).id, input));
};

export const unmark = async (req: Request, res: Response) => {
  const { id } = validate(idParamSchema, req.params);
  await intakesService.unmarkTaken(currentUser(req).id, id);
  res.status(204).end();
};
