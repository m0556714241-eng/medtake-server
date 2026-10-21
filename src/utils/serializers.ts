import type { IntakeLog, Prescription, User } from '@prisma/client';
import { dbToDateOnly, toZonedIso } from './time';

/** משתמש כפי שהוא נשלח ללקוח – בלי passwordHash */
export const toPublicUser = (user: User) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  caregiverId: user.caregiverId,
  birthDate: user.birthDate ? dbToDateOnly(user.birthDate) : null,
  createdAt: user.createdAt.toISOString(),
});

export type PublicUser = ReturnType<typeof toPublicUser>;

export const isLowStock = (p: Pick<Prescription, 'stockQuantity' | 'lowStockThreshold'>) =>
  p.stockQuantity <= p.lowStockThreshold;

/** מרשם כפי שהוא נשלח ללקוח – תואם לטיפוס Prescription בצד ה-React */
export const toPrescriptionDto = (p: Prescription) => ({
  id: p.id,
  patientId: p.patientId,
  createdBy: p.createdById,
  drugName: p.drugName,
  dosage: p.dosage,
  form: p.form,
  unitsPerDose: p.unitsPerDose,
  schedule: {
    days: [...p.scheduleDays].sort((a, b) => a - b),
    times: [...p.scheduleTimes].sort(),
  },
  startDate: dbToDateOnly(p.startDate),
  endDate: p.endDate ? dbToDateOnly(p.endDate) : null,
  instructions: p.instructions,
  missedAfterMinutes: p.missedAfterMinutes,
  stockQuantity: p.stockQuantity,
  lowStockThreshold: p.lowStockThreshold,
  status: p.status,
  isLowStock: isLowStock(p),
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

/** רשומת נטילה כפי שהיא נשלחת ללקוח */
export const toIntakeDto = (log: IntakeLog) => ({
  id: log.id,
  prescriptionId: log.prescriptionId,
  patientId: log.patientId,
  scheduledAt: toZonedIso(log.scheduledAt),
  takenAt: toZonedIso(log.takenAt),
  note: log.note,
});
