import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth';
import { idParamSchema, validate } from '../schemas/common';
import { createPatientSchema, patientQuerySchema, updatePatientSchema } from '../schemas/patient.schema';
import * as patientsService from '../services/patients.service';

export const list = async (req: Request, res: Response) => {
  const query = validate(patientQuerySchema, req.query);
  res.json(await patientsService.listPatients(currentUser(req).id, query));
};

export const getOne = async (req: Request, res: Response) => {
  const { id } = validate(idParamSchema, req.params);
  res.json(await patientsService.getPatient(currentUser(req).id, id));
};

export const create = async (req: Request, res: Response) => {
  const input = validate(createPatientSchema, req.body);
  res.status(201).json(await patientsService.createPatient(currentUser(req).id, input));
};

export const update = async (req: Request, res: Response) => {
  const { id } = validate(idParamSchema, req.params);
  const input = validate(updatePatientSchema, req.body);
  res.json(await patientsService.updatePatient(currentUser(req).id, id, input));
};

export const remove = async (req: Request, res: Response) => {
  const { id } = validate(idParamSchema, req.params);
  await patientsService.deletePatient(currentUser(req).id, id);
  res.status(204).end();
};
