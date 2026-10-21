import type { PrescriptionStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import type { AuthUser } from '../middleware/auth';
import type {
  CreatePrescriptionInput,
  PrescriptionQuery,
  UpdatePrescriptionInput,
} from '../schemas/prescription.schema';
import { toPrescriptionDto } from '../utils/serializers';
import { dateOnlyToDb } from '../utils/time';
import { getAccessiblePrescription, getOwnedPatient, resolveReadablePatientId } from './access.service';

/** הופך את שדות הטופס לעמודות במסד */
const toDbFields = (input: UpdatePrescriptionInput) => ({
  drugName: input.drugName,
  dosage: input.dosage,
  form: input.form,
  unitsPerDose: input.unitsPerDose,
  scheduleDays: input.schedule.days,
  scheduleTimes: input.schedule.times,
  startDate: dateOnlyToDb(input.startDate),
  endDate: input.endDate ? dateOnlyToDb(input.endDate) : null,
  instructions: input.instructions,
  missedAfterMinutes: input.missedAfterMinutes,
  stockQuantity: input.stockQuantity,
  lowStockThreshold: input.lowStockThreshold,
  status: input.status,
});

export const listPrescriptions = async (user: AuthUser, query: PrescriptionQuery) => {
  const patientId = await resolveReadablePatientId(user, query.patientId);
  const prescriptions = await prisma.prescription.findMany({
    where: {
      patientId,
      ...(query.search ? { drugName: { contains: query.search, mode: 'insensitive' as const } } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.form ? { form: query.form } : {}),
    },
    orderBy: [{ [query.sortBy]: query.sortOrder }, { createdAt: 'asc' }],
  });
  return prescriptions.map(toPrescriptionDto);
};

export const getPrescription = async (user: AuthUser, id: string) =>
  toPrescriptionDto(await getAccessiblePrescription(user, id));

export const createPrescription = async (caregiverId: string, input: CreatePrescriptionInput) => {
  await getOwnedPatient(caregiverId, input.patientId);
  const prescription = await prisma.prescription.create({
    data: { ...toDbFields(input), patientId: input.patientId, createdById: caregiverId },
  });
  return toPrescriptionDto(prescription);
};

export const updatePrescription = async (user: AuthUser, id: string, input: UpdatePrescriptionInput) => {
  await getAccessiblePrescription(user, id);
  const prescription = await prisma.prescription.update({ where: { id }, data: toDbFields(input) });
  return toPrescriptionDto(prescription);
};

export const updateStatus = async (user: AuthUser, id: string, status: PrescriptionStatus) => {
  await getAccessiblePrescription(user, id);
  const prescription = await prisma.prescription.update({ where: { id }, data: { status } });
  return toPrescriptionDto(prescription);
};

export const refillStock = async (user: AuthUser, id: string, quantity: number) => {
  await getAccessiblePrescription(user, id);
  const prescription = await prisma.prescription.update({
    where: { id },
    data: { stockQuantity: { increment: quantity } },
  });
  return toPrescriptionDto(prescription);
};

export const deletePrescription = async (user: AuthUser, id: string) => {
  await getAccessiblePrescription(user, id);
  await prisma.prescription.delete({ where: { id } });
};
