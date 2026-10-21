import { z } from 'zod';
import {
  dateOnlySchema,
  emailSchema,
  fullNameSchema,
  passwordSchema,
  queryBooleanSchema,
  sortOrderSchema,
} from './common';
import { todayDate } from '../utils/time';

const birthDateSchema = dateOnlySchema
  .refine((value) => value >= '1900-01-01', 'תאריך לידה לא סביר')
  .refine((value) => value <= todayDate(), 'תאריך לידה לא יכול להיות בעתיד');

export const createPatientSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  birthDate: birthDateSchema,
});

/** בעריכה – סיסמה ריקה או חסרה = ללא שינוי */
export const updatePatientSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  birthDate: birthDateSchema,
  password: z
    .union([z.literal(''), passwordSchema])
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const patientQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  sortBy: z.enum(['fullName', 'createdAt']).default('fullName'),
  sortOrder: sortOrderSchema,
  lowStock: queryBooleanSchema,
  missedToday: queryBooleanSchema,
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type PatientQuery = z.infer<typeof patientQuerySchema>;
