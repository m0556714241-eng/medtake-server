import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { validate } from '../schemas/common';
import * as authService from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  const input = validate(registerSchema, req.body);
  res.status(201).json(await authService.register(input));
};

export const login = async (req: Request, res: Response) => {
  const input = validate(loginSchema, req.body);
  res.json(await authService.login(input));
};

export const me = async (req: Request, res: Response) => {
  res.json(await authService.getMe(currentUser(req).id));
};
