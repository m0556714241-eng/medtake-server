import type { Message } from '@prisma/client';
import { prisma } from '../db/prisma';
import type { AuthUser } from '../middleware/auth';
import type { MessageQuery, SendMessageInput } from '../schemas/message.schema';
import { badRequest, notFound } from '../utils/httpError';
import { toZonedIso } from '../utils/time';
import { getOwnedPatient } from './access.service';

/** כמה הודעות אחרונות מחזירים – מספיק לתיבת הודעות, ולא מעמיס */
const MAX_MESSAGES = 50;

const toMessageDto = (message: Message & { patient: { fullName: string } }) => ({
  id: message.id,
  patientId: message.patientId,
  patientName: message.patient.fullName,
  text: message.text,
  createdAt: toZonedIso(message.createdAt),
});

/** מטופל שולח הודעה למטפל שלו. את המטפל מזהים לפי המטופל – לא סומכים על הלקוח. */
export const sendMessage = async (patientId: string, input: SendMessageInput) => {
  const patient = await prisma.user.findUnique({ where: { id: patientId } });
  if (!patient?.caregiverId) throw badRequest('אין מטפל משויך – אי אפשר לשלוח הודעה');

  const message = await prisma.message.create({
    data: { patientId, caregiverId: patient.caregiverId, text: input.text },
    include: { patient: { select: { fullName: true } } },
  });
  return toMessageDto(message);
};

/**
 * מטפל: ההודעות מכל המטופלים שלו (או ממטופל אחד, עם patientId).
 * מטופל: ההודעות ששלח. החדשות קודם.
 */
export const listMessages = async (user: AuthUser, query: MessageQuery) => {
  let where: { patientId?: string; caregiverId?: string };
  if (user.role === 'patient') {
    if (query.patientId && query.patientId !== user.id) throw notFound('המטופל לא נמצא');
    where = { patientId: user.id };
  } else {
    if (query.patientId) await getOwnedPatient(user.id, query.patientId);
    where = { caregiverId: user.id, ...(query.patientId ? { patientId: query.patientId } : {}) };
  }

  const messages = await prisma.message.findMany({
    where,
    include: { patient: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' },
    take: MAX_MESSAGES,
  });
  return messages.map(toMessageDto);
};

/** מטפל מוחק הודעה שקיבל (ניקוי התיבה). הודעה של מטפל אחר → 404. */
export const deleteMessage = async (caregiverId: string, id: string) => {
  const message = await prisma.message.findFirst({ where: { id, caregiverId } });
  if (!message) throw notFound('ההודעה לא נמצאה');
  await prisma.message.delete({ where: { id } });
};
