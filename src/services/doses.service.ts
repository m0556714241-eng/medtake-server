import type { IntakeLog, Prescription } from '@prisma/client';
import { prisma } from '../db/prisma';
import { isLowStock } from '../utils/serializers';
import {
  datesInRange,
  dbToDateOnly,
  doseDateTime,
  endOfDay,
  nowInZone,
  startOfDay,
  toZonedIso,
  weekdayIndex,
} from '../utils/time';
import { DateTime } from 'luxon';
import { APP_TIMEZONE } from '../config/timezone';

export type DoseStatus = 'pending' | 'taken' | 'missed';

export interface Dose {
  prescriptionId: string;
  drugName: string;
  dosage: string;
  form: Prescription['form'];
  unitsPerDose: number;
  scheduledAt: string;
  status: DoseStatus;
  takenAt: string | null;
  intakeId: string | null;
  isLowStock: boolean;
}

export interface DaySummary {
  date: string;
  total: number;
  taken: number;
  missed: number;
  pending: number;
}

const logKey = (prescriptionId: string, instantMs: number) => `${prescriptionId}|${instantMs}`;

/** האם התאריך (YYYY-MM-DD) בתוך תקופת המרשם ובאחד מימי הנטילה */
const isDoseDay = (p: Prescription, date: string): boolean => {
  if (date < dbToDateOnly(p.startDate)) return false;
  if (p.endDate && date > dbToDateOnly(p.endDate)) return false;
  return p.scheduleDays.includes(weekdayIndex(DateTime.fromISO(date, { zone: APP_TIMEZONE })));
};

/** האם הזמן הנתון הוא באמת מנה בלוח הזמנים של המרשם */
export const isScheduledDose = (p: Prescription, scheduledAt: Date): boolean => {
  const local = DateTime.fromJSDate(scheduledAt).setZone(APP_TIMEZONE);
  if (local.second !== 0 || local.millisecond !== 0) return false;
  const date = local.toISODate() as string;
  return isDoseDay(p, date) && p.scheduleTimes.includes(local.toFormat('HH:mm'));
};

const toDose = (
  p: Prescription,
  scheduledAt: DateTime,
  log: IntakeLog | undefined,
  now: DateTime,
): Dose => {
  let status: DoseStatus = 'pending';
  if (log) status = 'taken';
  else if (now > scheduledAt.plus({ minutes: p.missedAfterMinutes })) status = 'missed';

  return {
    prescriptionId: p.id,
    drugName: p.drugName,
    dosage: p.dosage,
    form: p.form,
    unitsPerDose: p.unitsPerDose,
    scheduledAt: scheduledAt.toISO({ suppressMilliseconds: true }) as string,
    status,
    takenAt: log ? toZonedIso(log.takenAt) : null,
    intakeId: log ? log.id : null,
    isLowStock: isLowStock(p),
  };
};

/**
 * מחשב את כל המנות של מטופל בטווח תאריכים.
 * מנות נוצרות מלוח הזמנים של מרשמים פעילים; סטטוס "נלקח" נקבע לפי IntakeLog.
 * נטילות שסומנו במרשם שכבר לא פעיל (או שלוח הזמנים שלו שונה) עדיין מוצגות כ"נלקח".
 */
export const computeDoses = async (patientId: string, from: string, to: string): Promise<Dose[]> => {
  const [prescriptions, logs] = await Promise.all([
    prisma.prescription.findMany({
      where: {
        patientId,
        status: 'active',
        startDate: { lte: new Date(`${to}T00:00:00.000Z`) },
        OR: [{ endDate: null }, { endDate: { gte: new Date(`${from}T00:00:00.000Z`) } }],
      },
    }),
    prisma.intakeLog.findMany({
      where: { patientId, scheduledAt: { gte: startOfDay(from), lte: endOfDay(to) } },
      include: { prescription: true },
    }),
  ]);

  const logsByKey = new Map(logs.map((log) => [logKey(log.prescriptionId, log.scheduledAt.getTime()), log]));
  const usedLogIds = new Set<string>();
  const now = nowInZone();
  const doses: Dose[] = [];

  for (const date of datesInRange(from, to)) {
    for (const p of prescriptions) {
      if (!isDoseDay(p, date)) continue;
      for (const time of p.scheduleTimes) {
        const scheduledAt = doseDateTime(date, time);
        const log = logsByKey.get(logKey(p.id, scheduledAt.toMillis()));
        if (log) usedLogIds.add(log.id);
        doses.push(toDose(p, scheduledAt, log, now));
      }
    }
  }

  for (const log of logs) {
    if (usedLogIds.has(log.id)) continue;
    const scheduledAt = DateTime.fromJSDate(log.scheduledAt).setZone(APP_TIMEZONE);
    doses.push(toDose(log.prescription, scheduledAt, log, now));
  }

  return doses.sort(
    (a, b) => a.scheduledAt.localeCompare(b.scheduledAt) || a.drugName.localeCompare(b.drugName, 'he'),
  );
};

/** סיכום לכל יום בטווח (כולל ימים בלי מנות) */
export const summarizeByDay = (doses: Dose[], from: string, to: string): DaySummary[] => {
  const byDate = new Map<string, DaySummary>(
    datesInRange(from, to).map((date) => [date, { date, total: 0, taken: 0, missed: 0, pending: 0 }]),
  );
  for (const dose of doses) {
    const summary = byDate.get(dose.scheduledAt.slice(0, 10));
    if (!summary) continue;
    summary.total += 1;
    summary[dose.status] += 1;
  }
  return [...byDate.values()];
};
