import type { Prescription, User } from '@prisma/client';
import { prisma } from '../db/prisma';
import type { AuthUser } from '../middleware/auth';
import { badRequest, notFound } from '../utils/httpError';

/**
 * מחזיר מטופל רק אם הוא שייך למטפל המחובר.
 * מטופל של מטפל אחר → 404 (לא חושפים שהוא קיים).
 */
export const getOwnedPatient = async (caregiverId: string, patientId: string): Promise<User> => {
  const patient = await prisma.user.findFirst({
    where: { id: patientId, caregiverId, role: 'patient' },
  });
  if (!patient) throw notFound('המטופל לא נמצא');
  return patient;
};

/**
 * קובע את מי מותר לקרוא:
 * מטופל – תמיד את עצמו. מטפל – חייב לציין patientId של מטופל שלו.
 */
export const resolveReadablePatientId = async (
  user: AuthUser,
  requestedPatientId: string | undefined,
): Promise<string> => {
  if (user.role === 'patient') {
    if (requestedPatientId && requestedPatientId !== user.id) throw notFound('המטופל לא נמצא');
    return user.id;
  }
  if (!requestedPatientId) {
    throw badRequest('יש לציין patientId', { patientId: 'שדה חובה עבור מטפל' });
  }
  await getOwnedPatient(user.id, requestedPatientId);
  return requestedPatientId;
};

/** מחזיר מרשם רק אם המשתמש המחובר רשאי לראות אותו */
export const getAccessiblePrescription = async (user: AuthUser, id: string): Promise<Prescription> => {
  const prescription = await prisma.prescription.findFirst({
    where:
      user.role === 'patient'
        ? { id, patientId: user.id }
        : { id, patient: { caregiverId: user.id } },
  });
  if (!prescription) throw notFound('המרשם לא נמצא');
  return prescription;
};
