import { z } from 'zod';
import { DateTime } from 'luxon';
import { dateOnlySchema, uuidSchema } from './common';

export const MAX_RANGE_DAYS = 31;

export const doseQuerySchema = z
  .object({
    from: dateOnlySchema,
    to: dateOnlySchema,
    patientId: uuidSchema.optional(),
    status: z.enum(['pending', 'taken', 'missed'], { message: 'סטטוס לא תקין' }).optional(),
  })
  .refine((q) => q.to >= q.from, { message: 'to חייב להיות אחרי from', path: ['to'] })
  .refine(
    (q) => DateTime.fromISO(q.to).diff(DateTime.fromISO(q.from), 'days').days < MAX_RANGE_DAYS,
    { message: `ניתן לבקש עד ${MAX_RANGE_DAYS} ימים`, path: ['to'] },
  );

export type DoseQuery = z.infer<typeof doseQuerySchema>;
