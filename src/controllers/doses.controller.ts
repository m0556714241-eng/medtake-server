import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth';
import { validate } from '../schemas/common';
import { doseQuerySchema } from '../schemas/dose.schema';
import { resolveReadablePatientId } from '../services/access.service';
import { computeDoses, summarizeByDay } from '../services/doses.service';

export const list = async (req: Request, res: Response) => {
  const query = validate(doseQuerySchema, req.query);
  const patientId = await resolveReadablePatientId(currentUser(req), query.patientId);
  const doses = await computeDoses(patientId, query.from, query.to);
  res.json(query.status ? doses.filter((d) => d.status === query.status) : doses);
};

export const summary = async (req: Request, res: Response) => {
  const query = validate(doseQuerySchema, req.query);
  const patientId = await resolveReadablePatientId(currentUser(req), query.patientId);
  const doses = await computeDoses(patientId, query.from, query.to);
  res.json(summarizeByDay(doses, query.from, query.to));
};
