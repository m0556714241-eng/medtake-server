import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import type { MarkIntakeInput } from '../schemas/intake.schema';
import { badRequest, conflict, notFound } from '../utils/httpError';
import { toIntakeDto } from '../utils/serializers';
import { isScheduledDose } from './doses.service';

/**
 * סימון "נלקח" (מטופל בלבד, רק לעצמו).
 * מוריד מהמלאי unitsPerDose – אם אין מספיק, המלאי יורד ל-0.
 * נשמר כמה ירד בפועל, כדי שביטול יחזיר בדיוק את אותה כמות.
 */
export const markTaken = async (patientId: string, input: MarkIntakeInput) => {
  const prescription = await prisma.prescription.findFirst({
    where: { id: input.prescriptionId, patientId },
  });
  if (!prescription) throw notFound('המרשם לא נמצא');
  if (prescription.status !== 'active') {
    throw badRequest('לא ניתן לסמן נטילה במרשם שאינו פעיל');
  }

  const scheduledAt = new Date(input.scheduledAt);
  if (!isScheduledDose(prescription, scheduledAt)) {
    throw badRequest('הזמן שנשלח אינו מנה בלוח הזמנים של המרשם', {
      scheduledAt: 'אין מנה מתוכננת בזמן הזה',
    });
  }

  try {
    const log = await prisma.$transaction(async (tx) => {
      const current = await tx.prescription.findUniqueOrThrow({ where: { id: prescription.id } });
      const unitsDeducted = Math.min(current.unitsPerDose, current.stockQuantity);

      const created = await tx.intakeLog.create({
        data: {
          prescriptionId: prescription.id,
          patientId,
          scheduledAt,
          takenAt: new Date(),
          unitsDeducted,
          note: input.note || null,
        },
      });
      await tx.prescription.update({
        where: { id: prescription.id },
        data: { stockQuantity: { decrement: unitsDeducted } },
      });
      return created;
    });
    return toIntakeDto(log);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw conflict('המנה הזו כבר סומנה כנלקחה');
    }
    throw error;
  }
};

/** ביטול סימון – מוחק את הרשומה ומחזיר למלאי את מה שירד */
export const unmarkTaken = async (patientId: string, intakeId: string) => {
  const log = await prisma.intakeLog.findFirst({ where: { id: intakeId, patientId } });
  if (!log) throw notFound('הסימון לא נמצא');

  await prisma.$transaction([
    prisma.intakeLog.delete({ where: { id: log.id } }),
    prisma.prescription.update({
      where: { id: log.prescriptionId },
      data: { stockQuantity: { increment: log.unitsDeducted } },
    }),
  ]);
};
