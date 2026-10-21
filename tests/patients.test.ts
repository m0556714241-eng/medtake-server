import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import {
  api,
  auth,
  createPatient,
  createPrescription,
  PASSWORD,
  registerCaregiver,
  resetDatabase,
} from './helpers';

beforeAll(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('ניהול מטופלים', () => {
  it('מטפל יוצר מטופל, והמטופל יכול להתחבר', async () => {
    const caregiver = await registerCaregiver();
    const res = await api()
      .post('/api/patients')
      .set(auth(caregiver.token))
      .send({ fullName: 'אברהם', email: 'avraham.p@test.dev', password: PASSWORD, birthDate: '1944-05-12' });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('patient');
    expect(res.body.caregiverId).toBe(caregiver.user.id);
    expect(res.body.birthDate).toBe('1944-05-12');

    const login = await api().post('/api/auth/login').send({ email: 'avraham.p@test.dev', password: PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('patient');
  });

  it('ולידציה: תאריך לידה בעתיד ומייל כפול', async () => {
    const caregiver = await registerCaregiver();
    const future = await api()
      .post('/api/patients')
      .set(auth(caregiver.token))
      .send({ fullName: 'בדיקה', email: 'future@test.dev', password: PASSWORD, birthDate: '2999-01-01' });
    expect(future.status).toBe(400);
    expect(future.body.errors.birthDate).toBeDefined();

    const duplicate = await api()
      .post('/api/patients')
      .set(auth(caregiver.token))
      .send({ fullName: 'בדיקה', email: caregiver.email, password: PASSWORD, birthDate: '1950-01-01' });
    expect(duplicate.status).toBe(409);
  });

  it('מטפל רואה רק את המטופלים שלו, עם סיכום היום', async () => {
    const a = await registerCaregiver('מטפל א');
    const b = await registerCaregiver('מטפל ב');
    await createPatient(a.token, 'מטופל של א');
    await createPatient(b.token, 'מטופל של ב');

    const res = await api().get('/api/patients').set(auth(a.token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].fullName).toBe('מטופל של א');
    expect(res.body[0]).toMatchObject({
      age: expect.any(Number),
      activePrescriptions: 0,
      todayTotal: 0,
      todayTaken: 0,
      todayMissed: 0,
      hasLowStock: false,
    });
  });

  it('חיפוש, מיון וסינון לפי מלאי נמוך', async () => {
    const caregiver = await registerCaregiver();
    const zvi = await createPatient(caregiver.token, 'צבי');
    await createPatient(caregiver.token, 'אהרון');
    await createPatient(caregiver.token, 'משה');
    await createPrescription(caregiver.token, zvi.user.id, { stockQuantity: 1, lowStockThreshold: 5 });

    const sorted = await api().get('/api/patients?sortBy=fullName&sortOrder=desc').set(auth(caregiver.token));
    expect(sorted.body.map((p: { fullName: string }) => p.fullName)).toEqual(['צבי', 'משה', 'אהרון']);

    const search = await api().get(`/api/patients?search=${encodeURIComponent('מש')}`).set(auth(caregiver.token));
    expect(search.body).toHaveLength(1);
    expect(search.body[0].fullName).toBe('משה');

    const low = await api().get('/api/patients?lowStock=true').set(auth(caregiver.token));
    expect(low.body).toHaveLength(1);
    expect(low.body[0].fullName).toBe('צבי');
    expect(low.body[0].hasLowStock).toBe(true);

    const bad = await api().get('/api/patients?sortBy=email').set(auth(caregiver.token));
    expect(bad.status).toBe(400);
  });

  it('עריכה בלי סיסמה לא משנה את הסיסמה; עם סיסמה – משנה', async () => {
    const caregiver = await registerCaregiver();
    const patient = await createPatient(caregiver.token);

    const edit = await api()
      .put(`/api/patients/${patient.user.id}`)
      .set(auth(caregiver.token))
      .send({ fullName: 'שם חדש', email: patient.email, birthDate: '1951-02-02', password: '' });
    expect(edit.status).toBe(200);
    expect(edit.body.fullName).toBe('שם חדש');
    expect((await api().post('/api/auth/login').send({ email: patient.email, password: PASSWORD })).status).toBe(200);

    await api()
      .put(`/api/patients/${patient.user.id}`)
      .set(auth(caregiver.token))
      .send({ fullName: 'שם חדש', email: patient.email, birthDate: '1951-02-02', password: 'NewPass123' });
    expect((await api().post('/api/auth/login').send({ email: patient.email, password: 'NewPass123' })).status).toBe(200);
  });

  it('מחיקת מטופל מוחקת גם את המרשמים שלו', async () => {
    const caregiver = await registerCaregiver();
    const patient = await createPatient(caregiver.token);
    const prescription = await createPrescription(caregiver.token, patient.user.id);

    const res = await api().delete(`/api/patients/${patient.user.id}`).set(auth(caregiver.token));
    expect(res.status).toBe(204);
    expect(await prisma.prescription.findUnique({ where: { id: prescription.id } })).toBeNull();
    expect((await api().get(`/api/patients/${patient.user.id}`).set(auth(caregiver.token))).status).toBe(404);
  });
});

describe('הרשאות מטופלים', () => {
  it('מטופל לא יכול לגשת לניהול מטופלים → 403', async () => {
    const caregiver = await registerCaregiver();
    const patient = await createPatient(caregiver.token);
    expect((await api().get('/api/patients').set(auth(patient.token))).status).toBe(403);
    expect(
      (
        await api()
          .post('/api/patients')
          .set(auth(patient.token))
          .send({ fullName: 'x', email: 'x@test.dev', password: PASSWORD, birthDate: '1950-01-01' })
      ).status,
    ).toBe(403);
  });

  it('מטפל לא יכול לראות/לערוך/למחוק מטופל של מטפל אחר → 404', async () => {
    const owner = await registerCaregiver();
    const other = await registerCaregiver();
    const patient = await createPatient(owner.token);

    expect((await api().get(`/api/patients/${patient.user.id}`).set(auth(other.token))).status).toBe(404);
    expect(
      (
        await api()
          .put(`/api/patients/${patient.user.id}`)
          .set(auth(other.token))
          .send({ fullName: 'פריצה', email: patient.email, birthDate: '1950-01-01' })
      ).status,
    ).toBe(404);
    expect((await api().delete(`/api/patients/${patient.user.id}`).set(auth(other.token))).status).toBe(404);
  });

  it('מזהה לא תקין → 400', async () => {
    const caregiver = await registerCaregiver();
    expect((await api().get('/api/patients/not-a-uuid').set(auth(caregiver.token))).status).toBe(400);
  });
});
