import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/db/prisma';
import { api, auth, createPatient, createPrescription, registerCaregiver, resetDatabase } from './helpers';

// "עכשיו" בבדיקות: יום רביעי 21/10/2026, 10:00 שעון ישראל
const NOW = new Date('2026-10-21T07:00:00.000Z');

type Ctx = {
  caregiver: Awaited<ReturnType<typeof registerCaregiver>>;
  patient: Awaited<ReturnType<typeof createPatient>>;
  prescription: { id: string };
};
let ctx: Ctx;

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  await resetDatabase();
});
afterAll(async () => {
  vi.useRealTimers();
  await prisma.$disconnect();
});

beforeEach(async () => {
  const caregiver = await registerCaregiver();
  const patient = await createPatient(caregiver.token);
  const prescription = await createPrescription(caregiver.token, patient.user.id, {
    startDate: '2026-10-19',
    unitsPerDose: 2,
    stockQuantity: 3,
    lowStockThreshold: 1,
    missedAfterMinutes: 60,
  });
  ctx = { caregiver, patient, prescription };
});

const doses = (token: string, qs: string) => api().get(`/api/doses?${qs}`).set(auth(token));
const mark = (token: string, prescriptionId: string, scheduledAt: string) =>
  api().post('/api/intakes').set(auth(token)).send({ prescriptionId, scheduledAt });

describe('חישוב מנות', () => {
  it('מנה שעבר זמנה = missed, מנה עתידית = pending', async () => {
    const res = await doses(ctx.patient.token, 'from=2026-10-21&to=2026-10-21');
    expect(res.status).toBe(200);
    expect(res.body.map((d: { scheduledAt: string; status: string }) => [d.scheduledAt, d.status])).toEqual([
      ['2026-10-21T08:00:00+03:00', 'missed'],
      ['2026-10-21T20:00:00+03:00', 'pending'],
    ]);
    expect(res.body[0]).toMatchObject({ drugName: 'אקמול', takenAt: null, intakeId: null, unitsPerDose: 2 });
  });

  it('אין מנות לפני תאריך ההתחלה, ומכבדים ימים בשבוע', async () => {
    const weekly = await createPrescription(ctx.caregiver.token, ctx.patient.user.id, {
      drugName: 'ויטמין',
      startDate: '2026-10-01',
      schedule: { days: [3], times: ['12:00'] },
    });
    const res = await doses(ctx.patient.token, 'from=2026-10-18&to=2026-10-22');
    const vitamin = res.body.filter((d: { prescriptionId: string }) => d.prescriptionId === weekly.id);
    expect(vitamin).toHaveLength(1);
    expect(vitamin[0].scheduledAt).toBe('2026-10-21T12:00:00+03:00');

    const first = res.body.filter((d: { prescriptionId: string }) => d.prescriptionId === ctx.prescription.id);
    expect(first[0].scheduledAt.startsWith('2026-10-19')).toBe(true);
  });

  it('סינון לפי סטטוס', async () => {
    const res = await doses(ctx.patient.token, 'from=2026-10-19&to=2026-10-21&status=missed');
    expect(res.body).toHaveLength(5);
    expect(res.body.every((d: { status: string }) => d.status === 'missed')).toBe(true);
  });

  it('סיכום שבועי לכל יום, כולל ימים בלי מנות', async () => {
    const res = await api()
      .get('/api/doses/summary?from=2026-10-18&to=2026-10-24')
      .set(auth(ctx.patient.token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(7);
    expect(res.body[0]).toEqual({ date: '2026-10-18', total: 0, taken: 0, missed: 0, pending: 0 });
    expect(res.body[1]).toEqual({ date: '2026-10-19', total: 2, taken: 0, missed: 2, pending: 0 });
    expect(res.body[3]).toEqual({ date: '2026-10-21', total: 2, taken: 0, missed: 1, pending: 1 });
    expect(res.body[6]).toEqual({ date: '2026-10-24', total: 2, taken: 0, missed: 0, pending: 2 });
  });

  it('ולידציה של טווח תאריכים', async () => {
    expect((await doses(ctx.patient.token, 'from=2026-10-21')).status).toBe(400);
    expect((await doses(ctx.patient.token, 'from=2026-10-21&to=2026-10-20')).status).toBe(400);
    expect((await doses(ctx.patient.token, 'from=2026-10-01&to=2026-11-15')).status).toBe(400);
    expect((await doses(ctx.patient.token, 'from=2026-02-30&to=2026-03-01')).status).toBe(400);
  });

  it('מטפל רואה מנות של המטופל שלו בלבד', async () => {
    const own = await doses(ctx.caregiver.token, `from=2026-10-21&to=2026-10-21&patientId=${ctx.patient.user.id}`);
    expect(own.status).toBe(200);
    expect(own.body).toHaveLength(2);

    expect((await doses(ctx.caregiver.token, 'from=2026-10-21&to=2026-10-21')).status).toBe(400);

    const other = await registerCaregiver();
    expect(
      (await doses(other.token, `from=2026-10-21&to=2026-10-21&patientId=${ctx.patient.user.id}`)).status,
    ).toBe(404);

    const otherPatient = await createPatient(other.token);
    expect(
      (await doses(otherPatient.token, `from=2026-10-21&to=2026-10-21&patientId=${ctx.patient.user.id}`)).status,
    ).toBe(404);
  });
});

describe('סימון נטילה ומלאי', () => {
  it('סימון מוריד מלאי, ביטול מחזיר', async () => {
    const res = await mark(ctx.patient.token, ctx.prescription.id, '2026-10-21T08:00:00+03:00');
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      prescriptionId: ctx.prescription.id,
      patientId: ctx.patient.user.id,
      scheduledAt: '2026-10-21T08:00:00+03:00',
      takenAt: '2026-10-21T10:00:00+03:00',
      note: null,
    });

    const after = await api().get(`/api/prescriptions/${ctx.prescription.id}`).set(auth(ctx.patient.token));
    expect(after.body.stockQuantity).toBe(1);
    expect(after.body.isLowStock).toBe(true);

    const list = await doses(ctx.patient.token, 'from=2026-10-21&to=2026-10-21');
    expect(list.body[0]).toMatchObject({ status: 'taken', intakeId: res.body.id, isLowStock: true });

    const undo = await api().delete(`/api/intakes/${res.body.id}`).set(auth(ctx.patient.token));
    expect(undo.status).toBe(204);
    const restored = await api().get(`/api/prescriptions/${ctx.prescription.id}`).set(auth(ctx.patient.token));
    expect(restored.body.stockQuantity).toBe(3);
  });

  it('כשהמלאי לא מספיק – יורד ל-0, וביטול מחזיר בדיוק את מה שירד', async () => {
    const first = await mark(ctx.patient.token, ctx.prescription.id, '2026-10-21T08:00:00+03:00'); // 3 → 1
    const second = await mark(ctx.patient.token, ctx.prescription.id, '2026-10-21T20:00:00+03:00'); // מנה עתידית: 1 → 0
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect((await prisma.prescription.findUnique({ where: { id: ctx.prescription.id } }))?.stockQuantity).toBe(0);

    await api().delete(`/api/intakes/${second.body.id}`).set(auth(ctx.patient.token));
    expect((await prisma.prescription.findUnique({ where: { id: ctx.prescription.id } }))?.stockQuantity).toBe(1);
  });

  it('אפשר להשלים מנה שפוספסה ביום קודם', async () => {
    const res = await mark(ctx.patient.token, ctx.prescription.id, '2026-10-19T20:00:00+03:00');
    expect(res.status).toBe(201);
  });

  it('אותה מנה פעמיים → 409', async () => {
    await mark(ctx.patient.token, ctx.prescription.id, '2026-10-21T08:00:00+03:00');
    const again = await mark(ctx.patient.token, ctx.prescription.id, '2026-10-21T05:00:00Z');
    expect(again.status).toBe(409);
  });

  it('זמן שאינו מנה בלוח הזמנים → 400', async () => {
    expect((await mark(ctx.patient.token, ctx.prescription.id, '2026-10-21T09:00:00+03:00')).status).toBe(400);
    expect((await mark(ctx.patient.token, ctx.prescription.id, '2026-10-18T08:00:00+03:00')).status).toBe(400);
    expect((await mark(ctx.patient.token, ctx.prescription.id, '2026-10-21 08:00')).status).toBe(400);
  });

  it('מרשם מושהה – אי אפשר לסמן, אבל מה שכבר סומן עדיין מוצג', async () => {
    await mark(ctx.patient.token, ctx.prescription.id, '2026-10-21T08:00:00+03:00');
    await api()
      .patch(`/api/prescriptions/${ctx.prescription.id}/status`)
      .set(auth(ctx.caregiver.token))
      .send({ status: 'paused' });

    expect((await mark(ctx.patient.token, ctx.prescription.id, '2026-10-21T20:00:00+03:00')).status).toBe(400);
    const list = await doses(ctx.patient.token, 'from=2026-10-21&to=2026-10-21');
    expect(list.body).toHaveLength(1);
    expect(list.body[0].status).toBe('taken');
  });

  it('רק המטופל עצמו מסמן', async () => {
    const asCaregiver = await mark(ctx.caregiver.token, ctx.prescription.id, '2026-10-21T08:00:00+03:00');
    expect(asCaregiver.status).toBe(403);

    const other = await createPatient(ctx.caregiver.token);
    expect((await mark(other.token, ctx.prescription.id, '2026-10-21T08:00:00+03:00')).status).toBe(404);

    const mine = await mark(ctx.patient.token, ctx.prescription.id, '2026-10-21T08:00:00+03:00');
    expect((await api().delete(`/api/intakes/${mine.body.id}`).set(auth(other.token))).status).toBe(404);
    expect((await api().delete(`/api/intakes/${mine.body.id}`).set(auth(ctx.caregiver.token))).status).toBe(403);
  });
});

describe('סיכום מטופל והתראות', () => {
  it('PatientSummary מחשב את היום ומלאי נמוך', async () => {
    await mark(ctx.patient.token, ctx.prescription.id, '2026-10-21T20:00:00+03:00');
    const res = await api().get(`/api/patients/${ctx.patient.user.id}`).set(auth(ctx.caregiver.token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      age: 76,
      activePrescriptions: 1,
      todayTotal: 2,
      todayTaken: 1,
      todayMissed: 1,
      hasLowStock: true,
    });

    const missed = await api().get('/api/patients?missedToday=true').set(auth(ctx.caregiver.token));
    expect(missed.body.map((p: { id: string }) => p.id)).toContain(ctx.patient.user.id);
  });

  it('התראות מלאי נמוך – מטפל רואה את כל המטופלים, מטופל רק את עצמו', async () => {
    const second = await createPatient(ctx.caregiver.token, 'מטופל שני');
    await createPrescription(ctx.caregiver.token, second.user.id, {
      drugName: 'נורמיטן',
      stockQuantity: 0,
      lowStockThreshold: 5,
    });
    await createPrescription(ctx.caregiver.token, second.user.id, {
      drugName: 'מושהה',
      stockQuantity: 0,
      lowStockThreshold: 5,
      status: 'paused',
    });
    await mark(ctx.patient.token, ctx.prescription.id, '2026-10-21T08:00:00+03:00'); // 3 → 1, סף 1

    const caregiverAlerts = await api().get('/api/alerts/low-stock').set(auth(ctx.caregiver.token));
    expect(caregiverAlerts.status).toBe(200);
    expect(caregiverAlerts.body.map((a: { drugName: string }) => a.drugName).sort()).toEqual(['אקמול', 'נורמיטן']);
    expect(caregiverAlerts.body.find((a: { drugName: string }) => a.drugName === 'נורמיטן')).toMatchObject({
      patientName: 'מטופל שני',
      stockQuantity: 0,
      lowStockThreshold: 5,
    });

    const patientAlerts = await api().get('/api/alerts/low-stock').set(auth(ctx.patient.token));
    expect(patientAlerts.body).toHaveLength(1);
    expect(patientAlerts.body[0].drugName).toBe('אקמול');

    expect((await api().get('/api/alerts/low-stock')).status).toBe(401);
  });
});
