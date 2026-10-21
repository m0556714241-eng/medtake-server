import { z } from 'zod';
import { emailSchema, fullNameSchema, passwordSchema } from './common';

/** הרשמה – כל מי שנרשם הוא מטפל. שדה role (אם נשלח) מתעלמים ממנו */
export const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'שדה חובה' }).min(1, 'שדה חובה'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
