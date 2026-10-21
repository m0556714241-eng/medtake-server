import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { api, auth, PASSWORD, registerCaregiver, resetDatabase } from './helpers';

beforeAll(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('הרשמה', () => {
  it('יוצרת מטפל ומחזירה token, בלי passwordHash', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ fullName: 'רחל', email: 'Rachel.Reg@Test.dev', password: PASSWORD, role: 'patient' });
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.role).toBe('caregiver');
    expect(res.body.user.email).toBe('rachel.reg@test.dev');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('מחזירה 409 על מייל קיים', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ fullName: 'רחל', email: 'rachel.reg@test.dev', password: PASSWORD });
    expect(res.status).toBe(409);
  });

  it('מחזירה 400 עם פירוט שגיאות לפי שדה', async () => {
    const res = await api().post('/api/auth/register').send({ fullName: 'א', email: 'bad', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.statusCode).toBe(400);
    expect(Object.keys(res.body.errors)).toEqual(expect.arrayContaining(['fullName', 'email', 'password']));
  });

  it('דורשת סיסמה עם אות וספרה', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ fullName: 'רחל', email: 'nodigit@test.dev', password: 'abcdefghij' });
    expect(res.status).toBe(400);
    expect(res.body.errors.password).toBeDefined();
  });

  it('מחזירה 400 על JSON לא תקין', async () => {
    const res = await api()
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"fullName": ');
    expect(res.status).toBe(400);
  });
});

describe('התחברות', () => {
  it('Login תקין מחזיר token ופרטי משתמש', async () => {
    const { email } = await registerCaregiver();
    const res = await api().post('/api/auth/login').send({ email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(email);
  });

  it('Login עם סיסמה שגויה מחזיר 401', async () => {
    const { email } = await registerCaregiver();
    const res = await api().post('/api/auth/login').send({ email, password: 'Wrong1234' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('מייל או סיסמה שגויים');
  });

  it('Login עם מייל לא קיים מחזיר 401 (אותה הודעה)', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'nobody@test.dev', password: PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('מייל או סיסמה שגויים');
  });

  it('Login בלי שדות מחזיר 400', async () => {
    const res = await api().post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('Token', () => {
  it('/auth/me מחזיר את המשתמש לפי ה-Token', async () => {
    const { token, user } = await registerCaregiver('דוד');
    const res = await api().get('/api/auth/me').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('בלי Token → 401', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('Token לא תקין → 401', async () => {
    const res = await api().get('/api/auth/me').set(auth('not-a-real-token'));
    expect(res.status).toBe(401);
  });

  it('Token חתום במפתח אחר → 401', async () => {
    const fake = jwt.sign({ role: 'caregiver' }, 'another-secret-another-secret-another', { subject: 'x' });
    const res = await api().get('/api/auth/me').set(auth(fake));
    expect(res.status).toBe(401);
  });

  it('Token שפג תוקפו → 401', async () => {
    const { user } = await registerCaregiver();
    const expired = jwt.sign({ role: 'caregiver' }, process.env.JWT_SECRET as string, {
      subject: user.id,
      expiresIn: -10,
    });
    const res = await api().get('/api/auth/me').set(auth(expired));
    expect(res.status).toBe(401);
  });
});
