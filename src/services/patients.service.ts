import type { User } from '@prisma/client';
import { prisma } from '../db/prisma';
import type { CreatePatientInput, PatientQuery, UpdatePatientInput } from '../schemas/patient.schema';
import { conflict } from '../utils/httpError';
import { isLowStock, toPublicUser } from '../utils/serializers';
import { ageFromBirthDate, dateOnlyToDb, todayDate } from '../utils/time';
import { getOwnedPatient } from './access.service';
import { hashPassword } from './auth.service';
import { computeDoses } from './doses.service';

/** פרטי מטופל + סיכום של היום (שדות מחושבים) */
const buildSummary = async (patient: User) => {
  const today = todayDate();
  const [doses, activePrescriptions] = await Promise.all([
    computeDoses(patient.id, today, today),
    prisma.prescription.findMany({
      where: { patientId: patient.id, status: 'active' },
      select: { stockQuantity: true, lowStockThreshold: true },
    }),
  ]);

  return {
    ...toPublicUser(patient),
    age: ageFromBirthDate(patient.birthDate),
    activePrescriptions: activePrescriptions.length,
    todayTotal: doses.length,
    todayTaken: doses.filter((d) => d.status === 'taken').length,
    todayMissed: doses.filter((d) => d.status === 'missed').length,
    hasLowStock: activePrescriptions.some(isLowStock),
  };
};

export const listPatients = async (caregiverId: string, query: PatientQuery) => {
  const patients = await prisma.user.findMany({
    where: {
      caregiverId,
      role: 'patient',
      ...(query.search ? { fullName: { contains: query.search, mode: 'insensitive' as const } } : {}),
    },
    orderBy: { [query.sortBy]: query.sortOrder },
  });

  const summaries = await Promise.all(patients.map(buildSummary));

  return summaries.filter(
    (s) => (!query.lowStock || s.hasLowStock) && (!query.missedToday || s.todayMissed > 0),
  );
};

export const getPatient = async (caregiverId: string, patientId: string) =>
  buildSummary(await getOwnedPatient(caregiverId, patientId));

const ensureEmailFree = async (email: string, exceptUserId?: string) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== exceptUserId) throw conflict('כתובת המייל כבר רשומה במערכת');
};

export const createPatient = async (caregiverId: string, input: CreatePatientInput) => {
  await ensureEmailFree(input.email);
  const patient = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: 'patient',
      caregiverId,
      birthDate: dateOnlyToDb(input.birthDate),
    },
  });
  return toPublicUser(patient);
};

export const updatePatient = async (caregiverId: string, patientId: string, input: UpdatePatientInput) => {
  await getOwnedPatient(caregiverId, patientId);
  await ensureEmailFree(input.email, patientId);
  const patient = await prisma.user.update({
    where: { id: patientId },
    data: {
      fullName: input.fullName,
      email: input.email,
      birthDate: dateOnlyToDb(input.birthDate),
      ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
    },
  });
  return toPublicUser(patient);
};

/** מחיקת מטופל – המרשמים והנטילות שלו נמחקים יחד איתו (Cascade) */
export const deletePatient = async (caregiverId: string, patientId: string) => {
  await getOwnedPatient(caregiverId, patientId);
  await prisma.user.delete({ where: { id: patientId } });
};
