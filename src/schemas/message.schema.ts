import { z } from 'zod';
import { uuidSchema } from './common';

export const sendMessageSchema = z.object({
  text: z
    .string({ required_error: 'שדה חובה', invalid_type_error: 'ההודעה חייבת להיות טקסט' })
    .trim()
    .min(1, 'ההודעה ריקה')
    .max(500, 'ההודעה ארוכה מדי (עד 500 תווים)'),
});

/** מטפל יכול לסנן לפי מטופל אחד. מטופל – תמיד רק ההודעות של עצמו. */
export const messageQuerySchema = z.object({
  patientId: uuidSchema.optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MessageQuery = z.infer<typeof messageQuerySchema>;
