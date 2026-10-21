/**
 * נתוני הדגמה ל-MedTake.
 * יוצר 3 מטפלים, 5 מטופלים, מרשמים בסטטוסים ובצורות שונים,
 * והיסטוריית נטילה של השבועיים האחרונים. כל הנתונים מומצאים.
 *
 * בטוח להרצה חוזרת: מוחק ויוצר מחדש רק את משתמשי ההדגמה (@medtake.dev).
 * בפרודקשן חובה להגדיר SEED_PASSWORD – אין סיסמה קבועה וידועה.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { DateTime } from 'luxon';
import { PrismaClient, type PrescriptionForm, type PrescriptionStatus } from '@prisma/client';
import { APP_TIMEZONE } from '../src/config/timezone';

const prisma = new PrismaClient();
const DEMO_DOMAIN = '@medtake.dev';

const resolvePassword = (): string => {
  if (process.env.SEED_PASSWORD) return process.env.SEED_PASSWORD;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('בפרודקשן יש להגדיר SEED_PASSWORD לפני הרצת ה-Seed');
  }
  return 'Medtake123';
};

/** מספרים "אקראיים" קבועים – כדי שכל הרצה תיצור אותם נתונים */
let randomState = 20261021;
const random = () => {
  randomState = (randomState * 1103515245 + 12345) % 2147483648;
  return randomState / 2147483648;
};

const today = DateTime.now().setZone(APP_TIMEZONE).startOf('day');
const daysFromToday = (offset: number) => today.plus({ days: offset }).toISODate() as string;
const dbDate = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

interface PrescriptionSeed {
  drugName: string;
  dosage: string;
  form: PrescriptionForm;
  unitsPerDose: number;
  days: number[];
  times: string[];
  startOffset: number;
  endOffset?: number;
  instructions: string;
  missedAfterMinutes?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status?: PrescriptionStatus;
}

interface PatientSeed {
  fullName: string;
  email: string;
  birthDate: string;
  joinedDaysAgo: number;
  adherence: number; // כמה מהמנות נלקחו (0-1)
  prescriptions: PrescriptionSeed[];
}

interface CaregiverSeed {
  fullName: string;
  email: string;
  joinedDaysAgo: number;
  patients: PatientSeed[];
}

const data: CaregiverSeed[] = [
  {
    fullName: 'רחל כהן',
    email: `rachel${DEMO_DOMAIN}`,
    joinedDaysAgo: 45,
    patients: [
      {
        fullName: 'אברהם כהן',
        email: `avraham${DEMO_DOMAIN}`,
        birthDate: '1944-05-12',
        joinedDaysAgo: 44,
        adherence: 0.9,
        prescriptions: [
          { drugName: 'אקמול', dosage: '500 מ"ג', form: 'tablet', unitsPerDose: 1, days: ALL_DAYS, times: ['08:00', '20:00'], startOffset: -40, instructions: 'אחרי האוכל', stockQuantity: 24, lowStockThreshold: 6 },
          { drugName: 'אלטרוקסין', dosage: '50 מק"ג', form: 'tablet', unitsPerDose: 1, days: ALL_DAYS, times: ['07:00'], startOffset: -40, instructions: 'על בטן ריקה, חצי שעה לפני האוכל', missedAfterMinutes: 90, stockQuantity: 4, lowStockThreshold: 7 },
          { drugName: 'אספירין', dosage: '100 מ"ג', form: 'tablet', unitsPerDose: 1, days: ALL_DAYS, times: ['13:00'], startOffset: -30, instructions: 'עם כוס מים', stockQuantity: 40, lowStockThreshold: 10 },
          { drugName: 'ויטמין D', dosage: '400 יב"ל', form: 'drops', unitsPerDose: 1, days: [0, 2, 4], times: ['09:00'], startOffset: -30, instructions: '', stockQuantity: 50, lowStockThreshold: 5, status: 'paused' },
        ],
      },
      {
        fullName: 'מרים כהן',
        email: `miriam${DEMO_DOMAIN}`,
        birthDate: '1947-11-03',
        joinedDaysAgo: 44,
        adherence: 0.95,
        prescriptions: [
          { drugName: 'מטפורמין', dosage: '850 מ"ג', form: 'tablet', unitsPerDose: 1, days: ALL_DAYS, times: ['08:00', '20:00'], startOffset: -40, instructions: 'עם הארוחה', stockQuantity: 56, lowStockThreshold: 10 },
          { drugName: 'סימבסטטין', dosage: '20 מ"ג', form: 'tablet', unitsPerDose: 1, days: ALL_DAYS, times: ['21:00'], startOffset: -40, instructions: 'בערב', stockQuantity: 12, lowStockThreshold: 5 },
          { drugName: 'משחת הידרוקורטיזון', dosage: '1%', form: 'cream', unitsPerDose: 1, days: [1, 3, 5], times: ['10:00'], startOffset: -21, instructions: 'שכבה דקה על האזור', missedAfterMinutes: 180, stockQuantity: 10, lowStockThreshold: 2 },
          { drugName: 'אמוקסיצילין', dosage: '500 מ"ג', form: 'capsule', unitsPerDose: 1, days: ALL_DAYS, times: ['08:00', '14:00', '20:00'], startOffset: -20, endOffset: -11, instructions: 'להשלים את כל הטיפול', stockQuantity: 0, lowStockThreshold: 0, status: 'finished' },
        ],
      },
    ],
  },
  {
    fullName: 'דוד לוי',
    email: `david${DEMO_DOMAIN}`,
    joinedDaysAgo: 30,
    patients: [
      {
        fullName: 'שמואל לוי',
        email: `shmuel${DEMO_DOMAIN}`,
        birthDate: '1950-02-20',
        joinedDaysAgo: 29,
        adherence: 0.7,
        prescriptions: [
          { drugName: 'נורמיטן', dosage: '50 מ"ג', form: 'tablet', unitsPerDose: 1, days: ALL_DAYS, times: ['09:00'], startOffset: -28, instructions: 'לחץ דם', stockQuantity: 3, lowStockThreshold: 5 },
          { drugName: 'אומפרדקס', dosage: '20 מ"ג', form: 'capsule', unitsPerDose: 1, days: ALL_DAYS, times: ['07:30'], startOffset: -28, instructions: 'לפני ארוחת הבוקר', stockQuantity: 28, lowStockThreshold: 7 },
          { drugName: 'סירופ נגד שיעול', dosage: '10 מ"ל', form: 'syrup', unitsPerDose: 1, days: ALL_DAYS, times: ['08:00', '14:00', '20:00'], startOffset: -6, endOffset: 4, instructions: 'לנער לפני השימוש', stockQuantity: 14, lowStockThreshold: 3 },
        ],
      },
      {
        fullName: 'יעקב לוי',
        email: `yaakov${DEMO_DOMAIN}`,
        birthDate: '1979-08-15',
        joinedDaysAgo: 20,
        adherence: 0.85,
        prescriptions: [
          { drugName: 'משאף ונטולין', dosage: '2 שאיפות', form: 'other', unitsPerDose: 2, days: [0, 1, 2, 3, 4], times: ['08:00'], startOffset: -19, instructions: 'לפני היציאה מהבית', missedAfterMinutes: 120, stockQuantity: 150, lowStockThreshold: 20 },
          { drugName: 'ויטמין B12', dosage: '1000 מק"ג', form: 'tablet', unitsPerDose: 1, days: [0, 3], times: ['12:00'], startOffset: -19, instructions: '', stockQuantity: 8, lowStockThreshold: 2 },
        ],
      },
    ],
  },
  {
    fullName: 'נועה פרידמן',
    email: `noa${DEMO_DOMAIN}`,
    joinedDaysAgo: 15,
    patients: [
      {
        fullName: 'משה פרידמן',
        email: `moshe${DEMO_DOMAIN}`,
        birthDate: '1956-01-30',
        joinedDaysAgo: 14,
        adherence: 0.8,
        prescriptions: [
          { drugName: 'קרדילוק', dosage: '5 מ"ג', form: 'tablet', unitsPerDose: 1, days: ALL_DAYS, times: ['08:00'], startOffset: -14, instructions: '', stockQuantity: 30, lowStockThreshold: 7 },
          { drugName: 'אלופורינול', dosage: '100 מ"ג', form: 'tablet', unitsPerDose: 1, days: ALL_DAYS, times: ['20:00'], startOffset: -14, instructions: 'לשתות הרבה מים', stockQuantity: 6, lowStockThreshold: 7 },
          { drugName: 'אינסולין לנטוס', dosage: '20 יחידות', form: 'injection', unitsPerDose: 1, days: ALL_DAYS, times: ['22:00'], startOffset: -14, instructions: 'זריקה תת-עורית', missedAfterMinutes: 60, stockQuantity: 15, lowStockThreshold: 5 },
        ],
      },
    ],
  },
];

/** היסטוריית נטילה: לכל מנה שזמנה עבר (עד 14 יום אחורה), לפי אחוז ההיענות של המטופל */
const buildHistory = (
  prescription: { id: string; patientId: string; unitsPerDose: number; missedAfterMinutes: number },
  seed: PrescriptionSeed,
  adherence: number,
) => {
  const now = DateTime.now().setZone(APP_TIMEZONE);
  const logs: { prescriptionId: string; patientId: string; scheduledAt: Date; takenAt: Date; unitsDeducted: number }[] = [];
  const firstDay = Math.max(seed.startOffset, -14);
  const lastDay = Math.min(seed.endOffset ?? 0, 0);

  for (let offset = firstDay; offset <= lastDay; offset++) {
    const day = today.plus({ days: offset });
    if (!seed.days.includes(day.weekday % 7)) continue;
    for (const time of seed.times) {
      const scheduledAt = DateTime.fromISO(`${day.toISODate()}T${time}`, { zone: APP_TIMEZONE });
      if (scheduledAt > now) continue;
      if (random() > adherence) continue;
      const takenAt = scheduledAt.plus({ minutes: Math.floor(random() * 45) });
      logs.push({
        prescriptionId: prescription.id,
        patientId: prescription.patientId,
        scheduledAt: scheduledAt.toJSDate(),
        takenAt: (takenAt > now ? now : takenAt).toJSDate(),
        unitsDeducted: prescription.unitsPerDose,
      });
    }
  }
  return logs;
};

async function main() {
  const passwordHash = await bcrypt.hash(resolvePassword(), 10);

  // מוחקים רק את משתמשי ההדגמה (מטופלים קודם, ואז מטפלים). המרשמים והנטילות נמחקים ב-Cascade.
  await prisma.user.deleteMany({ where: { email: { endsWith: DEMO_DOMAIN }, role: 'patient' } });
  await prisma.user.deleteMany({ where: { email: { endsWith: DEMO_DOMAIN } } });

  let prescriptionCount = 0;
  let logCount = 0;

  for (const caregiverSeed of data) {
    const caregiver = await prisma.user.create({
      data: {
        fullName: caregiverSeed.fullName,
        email: caregiverSeed.email,
        passwordHash,
        role: 'caregiver',
        createdAt: today.minus({ days: caregiverSeed.joinedDaysAgo }).plus({ hours: 10 }).toJSDate(),
      },
    });

    for (const patientSeed of caregiverSeed.patients) {
      const patient = await prisma.user.create({
        data: {
          fullName: patientSeed.fullName,
          email: patientSeed.email,
          passwordHash,
          role: 'patient',
          caregiverId: caregiver.id,
          birthDate: dbDate(patientSeed.birthDate),
          createdAt: today.minus({ days: patientSeed.joinedDaysAgo }).plus({ hours: 11 }).toJSDate(),
        },
      });

      for (const p of patientSeed.prescriptions) {
        const prescription = await prisma.prescription.create({
          data: {
            patientId: patient.id,
            createdById: caregiver.id,
            drugName: p.drugName,
            dosage: p.dosage,
            form: p.form,
            unitsPerDose: p.unitsPerDose,
            scheduleDays: p.days,
            scheduleTimes: p.times,
            startDate: dbDate(daysFromToday(p.startOffset)),
            endDate: p.endOffset === undefined ? null : dbDate(daysFromToday(p.endOffset)),
            instructions: p.instructions,
            missedAfterMinutes: p.missedAfterMinutes ?? 60,
            stockQuantity: p.stockQuantity,
            lowStockThreshold: p.lowStockThreshold,
            status: p.status ?? 'active',
          },
        });
        prescriptionCount++;

        if (p.status === 'paused') continue;
        const logs = buildHistory(prescription, p, patientSeed.adherence);
        if (logs.length > 0) {
          await prisma.intakeLog.createMany({ data: logs });
          logCount += logs.length;
        }
      }
    }
  }

  console.log(
    `Seed הסתיים: ${data.length} מטפלים, ${data.reduce((n, c) => n + c.patients.length, 0)} מטופלים, ` +
      `${prescriptionCount} מרשמים, ${logCount} נטילות.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
