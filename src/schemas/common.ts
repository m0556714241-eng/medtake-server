import { z } from 'zod';
import { DateTime } from 'luxon';
import { badRequest } from '../utils/httpError';
import { zodErrorsToMap } from '../middleware/errorHandler';

/** מאמת נתונים מול סכמה. נכשל → 400 עם פירוט לפי שדה */
export const validate = <T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw badRequest('הנתונים שנשלחו אינם תקינים', zodErrorsToMap(result.error));
  }
  return result.data;
};

export const uuidSchema = z.string().uuid('מזהה לא תקין');

export const idParamSchema = z.object({ id: uuidSchema });

/** תאריך בפורמט YYYY-MM-DD שהוא תאריך אמיתי */
export const dateOnlySchema = z
  .string({ required_error: 'שדה חובה' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'תאריך חייב להיות בפורמט YYYY-MM-DD')
  .refine((value) => DateTime.fromISO(value).isValid, 'תאריך לא קיים');

export const emailSchema = z
  .string({ required_error: 'שדה חובה' })
  .trim()
  .toLowerCase()
  .email('כתובת מייל לא תקינה')
  .max(255, 'כתובת מייל ארוכה מדי');

export const passwordSchema = z
  .string({ required_error: 'שדה חובה' })
  .min(8, 'סיסמה חייבת להכיל לפחות 8 תווים')
  .max(100, 'סיסמה ארוכה מדי')
  .regex(/[A-Za-z֐-׿]/, 'סיסמה חייבת להכיל לפחות אות אחת')
  .regex(/\d/, 'סיסמה חייבת להכיל לפחות ספרה אחת');

export const fullNameSchema = z
  .string({ required_error: 'שדה חובה' })
  .trim()
  .min(2, 'שם חייב להכיל לפחות 2 תווים')
  .max(100, 'שם ארוך מדי');

export const sortOrderSchema = z.enum(['asc', 'desc']).default('asc');

/** "true" / "false" ב-Query String → boolean */
export const queryBooleanSchema = z
  .enum(['true', 'false'], { message: 'ערך חייב להיות true או false' })
  .transform((value) => value === 'true')
  .optional();
