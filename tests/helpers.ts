import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/prisma';

export const app = createApp();
export const api = () => request(app);

let counter = 0;
const unique = (prefix: string) => `${prefix}.${Date.now()}.${++counter}@test.dev`;

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export const PASSWORD = 'Password123';

export const registerCaregiver = async (fullName = 'מטפל בדיקה') => {
  const res = await api()
    .post('/api/auth/register')
    .send({ fullName, email: unique('caregiver'), password: PASSWORD });
  return { token: res.body.token as string, user: res.body.user, email: res.body.user.email as string };
};

export const createPatient = async (caregiverToken: string, fullName = 'מטופל בדיקה') => {
  const email = unique('patient');
  const res = await api()
    .post('/api/patients')
    .set(auth(caregiverToken))
    .send({ fullName, email, password: PASSWORD, birthDate: '1950-01-01' });
  const login = await api().post('/api/auth/login').send({ email, password: PASSWORD });
  return { user: res.body, token: login.body.token as string, email };
};

export const prescriptionBody = (patientId: string, overrides: Record<string, unknown> = {}) => ({
  patientId,
  drugName: 'אקמול',
  dosage: '500 מ"ג',
  form: 'tablet',
  unitsPerDose: 1,
  schedule: { days: [0, 1, 2, 3, 4, 5, 6], times: ['08:00', '20:00'] },
  startDate: '2026-10-01',
  endDate: null,
  instructions: 'אחרי האוכל',
  missedAfterMinutes: 60,
  stockQuantity: 10,
  lowStockThreshold: 3,
  status: 'active',
  ...overrides,
});

export const createPrescription = async (
  caregiverToken: string,
  patientId: string,
  overrides: Record<string, unknown> = {},
) => {
  const res = await api()
    .post('/api/prescriptions')
    .set(auth(caregiverToken))
    .send(prescriptionBody(patientId, overrides));
  return res.body;
};

export const resetDatabase = async () => {
  await prisma.message.deleteMany();
  await prisma.intakeLog.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.user.deleteMany({ where: { role: 'patient' } });
  await prisma.user.deleteMany();
};
