import { z } from 'zod';
import { uuidSchema } from './common';

export const markIntakeSchema = z.object({
  prescriptionId: uuidSchema,
  scheduledAt: z
    .string({ required_error: 'שדה חובה' })
    .datetime({ offset: true, message: 'זמן חייב להיות בפורמט ISO, למשל 2026-10-21T08:00:00+03:00' }),
  note: z.string().trim().max(200, 'ארוך מדי').optional(),
});

export type MarkIntakeInput = z.infer<typeof markIntakeSchema>;
