import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import {
  api,
  auth,
  createPatient,
  createPrescription,
  prescriptionBody,
  registerCaregiver,
  resetDatabase,
} from './helpers';

beforeAll(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('CRUD מרשמים', () => {
  it('מטפל יוצר מרשם – התשובה תואמת לטיפוס Prescription', async () => {
    const caregiver = await registerCaregiver();
    const patient = await createPatient(caregiver.token);
    const res = await api()
      .post('/api/prescriptions')
      .set(auth(caregiver.token))
      .send(prescriptionBody(patient.user.id, { schedule: { days: [3, 1], times: ['20:00', '08:00'] } }));

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      patientId: patient.user.id,
      createdBy: caregiver.user.id,
      drugName: 'אקמול',
      schedule: { days: [1, 3], times: ['08:00', '20:00'] },
      startDate: '2026-10-01',
      endDate: null,
      status: 'active',
      isLowStock: false,
    });
    expect(res.body.updatedAt).toEqual(expect.any(String));
  });

  it('עריכה, שינוי סטטוס, חידוש מלאי ומחיקה', async () => {
    const caregiver = await registerCaregiver();
    const patient = await createPatient(caregiver.token);
    const p = await createPrescription(caregiver.token, patient.user.id, { stockQuantity: 2, lowStockThreshold: 3 });
    expect(p.isLowStock).toBe(true);

    const edit = await api()
      .put(`/api/prescriptions/${p.id}`)
      .set(auth(caregiver.token))
      .send(prescriptionBody(patient.user.id, { drugName: 'נורופן', dosage: '200 מ"ג' }));
    expect(edit.status).toBe(200);
    expect(edit.body.drugName).toBe('נורופן');

    const status = await api()
      .patch(`/api/prescriptions/${p.id}/status`)
      .set(auth(caregiver.token))
      .send({ status: 'paused' });
    expect(status.body.status).toBe('paused');

    const refill = await api()
      .post(`/api/prescriptions/${p.id}/refill`)
      .set(auth(caregiver.token))
      .send({ quantity: 30 });
    expect(refill.status).toBe(200);
    expect(refill.body.stockQuantity).toBe(40);

    const del = await api().delete(`/api/prescriptions/${p.id}`).set(auth(caregiver.token));
    expect(del.status).toBe(204);
    expect((await api().get(`/api/prescriptions/${p.id}`).set(auth(caregiver.token))).status).toBe(404);
  });
});

describe('ולידציה של מרשם', () => {
  it('לוח זמנים ריק, שעה לא תקינה, תאריך סיום לפני התחלה, צורה לא קיימת', async () => {
    const caregiver = await registerCaregiver();
    const patient = await createPatient(caregiver.token);
    const res = await api()
      .post('/api/prescriptions')
      .set(auth(caregiver.token))
      .send(
        prescriptionBody(patient.user.id, {
          schedule: { days: [], times: ['25:00'] },
          endDate: '2026-09-01',
          form: 'pill',
          unitsPerDose: 0,
          drugName: '',
        }),
      );
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors)).toEqual(
      expect.arrayContaining(['schedule.days', 'schedule.times.0', 'form', 'unitsPerDose', 'drugName']),
    );
  });

  it('תאריך סיום לפני תאריך התחלה', async () => {
    const caregiver = await registerCaregiver();
    const patient = await createPatient(caregiver.token);
    const res = await api()
      .post('/api/prescriptions')
      .set(auth(caregiver.token))
      .send(prescriptionBody(patient.user.id, { endDate: '2026-09-01' }));
    expect(res.status).toBe(400);
    expect(res.body.errors.endDate).toBeDefined();
  });

  it('חידוש מלאי בכמות 0 → 400', async () => {
    const caregiver = await registerCaregiver();
    const patient = await createPatient(caregiver.token);
    const p = await createPrescription(caregiver.token, patient.user.id);
    const res = await api().post(`/api/prescriptions/${p.id}/refill`).set(auth(caregiver.token)).send({ quantity: 0 });
    expect(res.status).toBe(400);
  });
});

describe('חיפוש, סינון ומיון', () => {
  it('לפי שם, סטטוס, צורה ומלאי', async () => {
    const caregiver = await registerCaregiver();
    const patient = await createPatient(caregiver.token);
    const id = patient.user.id;
    await createPrescription(caregiver.token, id, { drugName: 'אקמול', stockQuantity: 20 });
    await createPrescription(caregiver.token, id, { drugName: 'אומפרדקס', form: 'capsule', stockQuantity: 5 });
    await createPrescription(caregiver.token, id, { drugName: 'סירופ', form: 'syrup', stockQuantity: 50, status: 'finished' });

    const get = (qs: string) => api().get(`/api/prescriptions?patientId=${id}&${qs}`).set(auth(caregiver.token));
    const names = (res: { body: { drugName: string }[] }) => res.body.map((p) => p.drugName);

    expect(names(await get(`search=${encodeURIComponent('אקמ')}`))).toEqual(['אקמול']);
    expect(names(await get('status=finished'))).toEqual(['סירופ']);
    expect(names(await get('form=capsule'))).toEqual(['אומפרדקס']);
    expect(names(await get('sortBy=stockQuantity&sortOrder=desc'))).toEqual(['סירופ', 'אקמול', 'אומפרדקס']);
    expect((await get('status=deleted')).status).toBe(400);
  });

  it('מטפל חייב לציין patientId', async () => {
    const caregiver = await registerCaregiver();
    const res = await api().get('/api/prescriptions').set(auth(caregiver.token));
    expect(res.status).toBe(400);
    expect(res.body.errors.patientId).toBeDefined();
  });
});

describe('הרשאות מרשמים', () => {
  it('מטופל רואה את המרשמים שלו אבל לא יכול לשנות → 403', async () => {
    const caregiver = await registerCaregiver();
    const patient = await createPatient(caregiver.token);
    const p = await createPrescription(caregiver.token, patient.user.id);

    const list = await api().get('/api/prescriptions').set(auth(patient.token));
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect((await api().get(`/api/prescriptions/${p.id}`).set(auth(patient.token))).status).toBe(200);

    expect(
      (await api().post('/api/prescriptions').set(auth(patient.token)).send(prescriptionBody(patient.user.id))).status,
    ).toBe(403);
    expect((await api().put(`/api/prescriptions/${p.id}`).set(auth(patient.token)).send(prescriptionBody(patient.user.id))).status).toBe(403);
    expect((await api().post(`/api/prescriptions/${p.id}/refill`).set(auth(patient.token)).send({ quantity: 5 })).status).toBe(403);
    expect((await api().delete(`/api/prescriptions/${p.id}`).set(auth(patient.token))).status).toBe(403);
  });

  it('אין גישה למרשמים של אחרים → 404', async () => {
    const owner = await registerCaregiver();
    const other = await registerCaregiver();
    const patient = await createPatient(owner.token);
    const otherPatient = await createPatient(other.token);
    const p = await createPrescription(owner.token, patient.user.id);

    // מטפל אחר
    expect((await api().get(`/api/prescriptions/${p.id}`).set(auth(other.token))).status).toBe(404);
    expect((await api().get(`/api/prescriptions?patientId=${patient.user.id}`).set(auth(other.token))).status).toBe(404);
    expect(
      (await api().post('/api/prescriptions').set(auth(other.token)).send(prescriptionBody(patient.user.id))).status,
    ).toBe(404);
    expect((await api().delete(`/api/prescriptions/${p.id}`).set(auth(other.token))).status).toBe(404);

    // מטופל אחר
    expect((await api().get(`/api/prescriptions/${p.id}`).set(auth(otherPatient.token))).status).toBe(404);
    expect(
      (await api().get(`/api/prescriptions?patientId=${patient.user.id}`).set(auth(otherPatient.token))).status,
    ).toBe(404);
  });
});
