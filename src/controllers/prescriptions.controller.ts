import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth';
import { idParamSchema, validate } from '../schemas/common';
import {
  createPrescriptionSchema,
  prescriptionQuerySchema,
  refillSchema,
  statusSchema,
  updatePrescriptionSchema,
} from '../schemas/prescription.schema';
import * as prescriptionsService from '../services/prescriptions.service';

export const list = async (req: Request, res: Response) => {
  const query = validate(prescriptionQuerySchema, req.query);
  res.json(await prescriptionsService.listPrescriptions(currentUser(req), query));
};

export const getOne = async (req: Request, res: Response) => {
  const { id } = validate(idParamSchema, req.params);
  res.json(await prescriptionsService.getPrescription(currentUser(req), id));
};

export const create = async (req: Request, res: Response) => {
  const input = validate(createPrescriptionSchema, req.body);
  res.status(201).json(await prescriptionsService.createPrescription(currentUser(req).id, input));
};

export const update = async (req: Request, res: Response) => {
  const { id } = validate(idParamSchema, req.params);
  const input = validate(updatePrescriptionSchema, req.body);
  res.json(await prescriptionsService.updatePrescription(currentUser(req), id, input));
};

export const changeStatus = async (req: Request, res: Response) => {
  const { id } = validate(idParamSchema, req.params);
  const { status } = validate(statusSchema, req.body);
  res.json(await prescriptionsService.updateStatus(currentUser(req), id, status));
};

export const refill = async (req: Request, res: Response) => {
  const { id } = validate(idParamSchema, req.params);
  const { quantity } = validate(refillSchema, req.body);
  res.json(await prescriptionsService.refillStock(currentUser(req), id, quantity));
};

export const remove = async (req: Request, res: Response) => {
  const { id } = validate(idParamSchema, req.params);
  await prescriptionsService.deletePrescription(currentUser(req), id);
  res.status(204).end();
};
