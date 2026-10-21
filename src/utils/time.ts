import { DateTime } from 'luxon';
import { APP_TIMEZONE } from '../config/timezone';

/** הזמן הנוכחי באזור הזמן של המערכת */
export const nowInZone = (): DateTime => DateTime.now().setZone(APP_TIMEZONE);

/** תאריך היום בפורמט YYYY-MM-DD לפי שעון ישראל */
export const todayDate = (): string => nowInZone().toISODate() as string;

/** ממיר מחרוזת YYYY-MM-DD ל-Date לשמירה בעמודת DATE */
export const dateOnlyToDb = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

/** ממיר עמודת DATE מהמסד למחרוזת YYYY-MM-DD */
export const dbToDateOnly = (value: Date): string => value.toISOString().slice(0, 10);

/** יום בשבוע במוסכמה של המערכת: 0 = ראשון ... 6 = שבת */
export const weekdayIndex = (date: DateTime): number => date.weekday % 7;

/** כל התאריכים (YYYY-MM-DD) בין from ל-to כולל */
export const datesInRange = (from: string, to: string): string[] => {
  const result: string[] = [];
  let cursor = DateTime.fromISO(from, { zone: APP_TIMEZONE });
  const end = DateTime.fromISO(to, { zone: APP_TIMEZONE });
  while (cursor <= end) {
    result.push(cursor.toISODate() as string);
    cursor = cursor.plus({ days: 1 });
  }
  return result;
};

/** תחילת היום של התאריך (שעון ישראל) כ-Date */
export const startOfDay = (date: string): Date =>
  DateTime.fromISO(date, { zone: APP_TIMEZONE }).startOf('day').toJSDate();

/** סוף היום של התאריך (שעון ישראל) כ-Date */
export const endOfDay = (date: string): Date =>
  DateTime.fromISO(date, { zone: APP_TIMEZONE }).endOf('day').toJSDate();

/** גיל בשנים שלמות לפי תאריך לידה */
export const ageFromBirthDate = (birthDate: Date | null): number | null => {
  if (!birthDate) return null;
  const birth = DateTime.fromISO(dbToDateOnly(birthDate), { zone: APP_TIMEZONE });
  return Math.floor(nowInZone().diff(birth, 'years').years);
};

/** זמן מנה (תאריך + שעה בשעון ישראל) */
export const doseDateTime = (date: string, time: string): DateTime =>
  DateTime.fromISO(`${date}T${time}`, { zone: APP_TIMEZONE });

/** ISO עם היסט שעון ישראל, ללא מילישניות */
export const toZonedIso = (value: Date): string =>
  DateTime.fromJSDate(value).setZone(APP_TIMEZONE).toISO({ suppressMilliseconds: true }) as string;
