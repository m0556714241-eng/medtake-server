import type { Request, Response } from 'express';
import { currentUser } from '../middleware/auth';
import { idParamSchema, validate } from '../schemas/common';
import { messageQuerySchema, sendMessageSchema } from '../schemas/message.schema';
import * as messagesService from '../services/messages.service';

export const send = async (req: Request, res: Response) => {
  const input = validate(sendMessageSchema, req.body);
  res.status(201).json(await messagesService.sendMessage(currentUser(req).id, input));
};

export const list = async (req: Request, res: Response) => {
  const query = validate(messageQuerySchema, req.query);
  res.json(await messagesService.listMessages(currentUser(req), query));
};

export const remove = async (req: Request, res: Response) => {
  const { id } = validate(idParamSchema, req.params);
  await messagesService.deleteMessage(currentUser(req).id, id);
  res.status(204).end();
};
