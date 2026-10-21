import { z } from 'zod';
import { dateOnlySchema, sortOrderSchema, uuidSchema } from './common';

export const PRESCRIPTION_FORMS = ['tablet', 'capsule', 'syrup', 'drops', 'injection', 'cream', 'other'] as const;
export const PRESCRIPTION_STATUSES = ['active', 'paused', 'finished'] as const;

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'שעה חייבת להיות בפורמט HH:mm');

export const scheduleSchema = z.object(
  {
    days: z
      .array(z.number().int().min(0, 'יום לא תקין').max(6, 'יום לא תקין'), { required_error: 'שדה חובה' })
      .min(1, 'יש לבחור לפחות יום אחד')
      .refine((days) => new Set(days).size === days.length, 'יש ימים כפולים'),
    times: z
      .array(timeSchema, { required_error: 'שדה חובה' })
      .min(1, 'יש להזין לפחות שעה אחת')
      .max(12, 'ניתן להזין עד 12 שעות ביום')
      .refine((times) => new Set(times).size === times.length, 'יש שעות כפולות'),
  },
  { required_error: 'שדה חובה' },
);

const intField = (min: number, max: number) =>
  z
    .number({ required_error: 'שדה חובה', invalid_type_error: 'חייב להיות מספר' })
    .int('חייב להיות מספר שלם')
    .min(min, `ערך מינימלי: ${min}`)
    .max(max, `ערך מקסימלי: ${max}`);

/** שדות המרשם שהמטפל ממלא בטופס (תואם PrescriptionFormValues בלי patientId) */
const prescriptionFieldsSchema = z.object({
  drugName: z.string({ required_error: 'שדה חובה' }).trim().min(1, 'שדה חובה').max(100, 'ארוך מדי'),
  dosage: z.string({ required_error: 'שדה חובה' }).trim().min(1, 'שדה חובה').max(50, 'ארוך מדי'),
  form: z.enum(PRESCRIPTION_FORMS, { message: 'צורת תרופה לא תקינה' }),
  unitsPerDose: intField(1, 100),
  schedule: scheduleSchema,
  startDate: dateOnlySchema,
  endDate: dateOnlySchema.nullable().optional().transform((value) => value ?? null),
  instructions: z.string().trim().max(500, 'ארוך מדי').optional().default(''),
  missedAfterMinutes: intField(5, 720).optional().default(60),
  stockQuantity: intField(0, 100000),
  lowStockThreshold: intField(0, 100000),
  status: z.enum(PRESCRIPTION_STATUSES, { message: 'סטטוס לא תקין' }).optional().default('active'),
});

const endAfterStart = (data: { startDate: string; endDate: string | null }) =>
  data.endDate === null || data.endDate >= data.startDate;
const endAfterStartError = { message: 'תאריך סיום לא יכול להיות לפני תאריך ההתחלה', path: ['endDate'] };

export const createPrescriptionSchema = prescriptionFieldsSchema
  .extend({ patientId: uuidSchema })
  .refine(endAfterStart, endAfterStartError);

/** בעריכה לא ניתן להעביר מרשם למטופל אחר – patientId (אם נשלח) מתעלמים ממנו */
export const updatePrescriptionSchema = prescriptionFieldsSchema
  .extend({ patientId: z.unknown().optional() })
  .refine(endAfterStart, endAfterStartError);

export const statusSchema = z.object({
  status: z.enum(PRESCRIPTION_STATUSES, { message: 'סטטוס לא תקין' }),
});

export const refillSchema = z.object({
  quantity: intField(1, 10000),
});

export const prescriptionQuerySchema = z.object({
  patientId: uuidSchema.optional(),
  search: z.string().trim().max(100).optional(),
  status: z.enum(PRESCRIPTION_STATUSES, { message: 'סטטוס לא תקין' }).optional(),
  form: z.enum(PRESCRIPTION_FORMS, { message: 'צורת תרופה לא תקינה' }).optional(),
  sortBy: z.enum(['drugName', 'startDate', 'stockQuantity']).default('drugName'),
  sortOrder: sortOrderSchema,
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type UpdatePrescriptionInput = z.infer<typeof updatePrescriptionSchema>;
export type PrescriptionQuery = z.infer<typeof prescriptionQuerySchema>;
