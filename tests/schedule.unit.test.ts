import { describe, expect, it } from 'vitest';
import type { Prescription } from '@prisma/client';
import { isScheduledDose, summarizeByDay, type Dose } from '../src/services/doses.service';
import { datesInRange, weekdayIndex } from '../src/utils/time';
import { DateTime } from 'luxon';

const prescription = {
  scheduleDays: [0, 3],
  scheduleTimes: ['08:00', '20:30'],
  startDate: new Date('2026-10-01T00:00:00.000Z'),
  endDate: new Date('2026-10-31T00:00:00.000Z'),
} as Prescription;

describe('לוח זמנים (Unit)', () => {
  it('weekdayIndex: ראשון = 0, שבת = 6', () => {
    expect(weekdayIndex(DateTime.fromISO('2026-10-18'))).toBe(0);
    expect(weekdayIndex(DateTime.fromISO('2026-10-24'))).toBe(6);
  });

  it('datesInRange כולל את שני הקצוות', () => {
    expect(datesInRange('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  });

  it('isScheduledDose בודק יום, שעה ותקופה', () => {
    expect(isScheduledDose(prescription, new Date('2026-10-21T08:00:00+03:00'))).toBe(true); // רביעי
    expect(isScheduledDose(prescription, new Date('2026-10-18T20:30:00+03:00'))).toBe(true); // ראשון
    expect(isScheduledDose(prescription, new Date('2026-10-22T08:00:00+03:00'))).toBe(false); // חמישי
    expect(isScheduledDose(prescription, new Date('2026-10-21T08:01:00+03:00'))).toBe(false);
    expect(isScheduledDose(prescription, new Date('2026-09-30T08:00:00+03:00'))).toBe(false); // לפני ההתחלה
    expect(isScheduledDose(prescription, new Date('2026-11-01T08:00:00+02:00'))).toBe(false); // אחרי הסיום
  });

  it('isScheduledDose עובד גם אחרי מעבר לשעון חורף', () => {
    // 28/10/2026 (רביעי) – כבר שעון חורף, היסט +02:00
    expect(isScheduledDose(prescription, new Date('2026-10-28T08:00:00+02:00'))).toBe(true);
  });

  it('summarizeByDay סופר לפי סטטוס', () => {
    const dose = (scheduledAt: string, status: Dose['status']) => ({ scheduledAt, status }) as Dose;
    const result = summarizeByDay(
      [dose('2026-10-20T08:00:00+03:00', 'taken'), dose('2026-10-20T20:00:00+03:00', 'missed'), dose('2026-10-21T08:00:00+03:00', 'pending')],
      '2026-10-20',
      '2026-10-21',
    );
    expect(result).toEqual([
      { date: '2026-10-20', total: 2, taken: 1, missed: 1, pending: 0 },
      { date: '2026-10-21', total: 1, taken: 0, missed: 0, pending: 1 },
    ]);
  });
});
