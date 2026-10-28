import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { api, auth, createPatient, registerCaregiver, resetDatabase } from './helpers';

type Ctx = {
  caregiver: Awaited<ReturnType<typeof registerCaregiver>>;
  patient: Awaited<ReturnType<typeof createPatient>>;
};
let ctx: Ctx;

beforeAll(async () => {
  await resetDatabase();
});
afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  const caregiver = await registerCaregiver();
  const patient = await createPatient(caregiver.token, 'אברהם בדיקה');
  ctx = { caregiver, patient };
});

const send = (token: string, body: object) => api().post('/api/messages').set(auth(token)).send(body);
const list = (token: string, qs = '') => api().get(`/api/messages${qs}`).set(auth(token));

describe('הודעות', () => {
  it('מטופל שולח, והמטפל שלו רואה את ההודעה עם שם המטופל', async () => {
    const sent = await send(ctx.patient.token, { text: '  האקמול כמעט נגמר  ' });
    expect(sent.status).toBe(201);
    expect(sent.body).toMatchObject({ patientId: ctx.patient.user.id, patientName: 'אברהם בדיקה', text: 'האקמול כמעט נגמר' });

    const res = await list(ctx.caregiver.token);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: sent.body.id, text: 'האקמול כמעט נגמר' });
  });

  it('החדשות קודם, וסינון לפי מטופל', async () => {
    const other = await createPatient(ctx.caregiver.token, 'מרים בדיקה');
    await send(ctx.patient.token, { text: 'ראשונה' });
    await send(other.token, { text: 'שנייה' });

    const all = await list(ctx.caregiver.token);
    expect(all.body.map((m: { text: string }) => m.text)).toEqual(['שנייה', 'ראשונה']);

    const one = await list(ctx.caregiver.token, `?patientId=${other.user.id}`);
    expect(one.body.map((m: { text: string }) => m.text)).toEqual(['שנייה']);
  });

  it('מטופל רואה רק את ההודעות של עצמו', async () => {
    const other = await createPatient(ctx.caregiver.token, 'מרים בדיקה');
    await send(ctx.patient.token, { text: 'שלי' });
    await send(other.token, { text: 'של אחר' });

    const res = await list(ctx.patient.token);
    expect(res.body.map((m: { text: string }) => m.text)).toEqual(['שלי']);
    expect((await list(ctx.patient.token, `?patientId=${other.user.id}`)).status).toBe(404);
  });

  it('מטפל אחר לא רואה ולא מוחק', async () => {
    const sent = await send(ctx.patient.token, { text: 'פרטי' });
    const stranger = await registerCaregiver('מטפל זר');

    expect((await list(stranger.token)).body).toEqual([]);
    expect((await list(stranger.token, `?patientId=${ctx.patient.user.id}`)).status).toBe(404);
    expect((await api().delete(`/api/messages/${sent.body.id}`).set(auth(stranger.token))).status).toBe(404);
  });

  it('הודעה ריקה או ארוכה מדי → 400', async () => {
    const empty = await send(ctx.patient.token, { text: '   ' });
    expect(empty.status).toBe(400);
    expect(empty.body.errors).toHaveProperty('text');

    expect((await send(ctx.patient.token, { text: 'א'.repeat(501) })).status).toBe(400);
    expect((await send(ctx.patient.token, {})).status).toBe(400);
  });

  it('רק מטופל שולח; רק מטפל מוחק', async () => {
    expect((await send(ctx.caregiver.token, { text: 'שלום' })).status).toBe(403);

    const sent = await send(ctx.patient.token, { text: 'למחיקה' });
    expect((await api().delete(`/api/messages/${sent.body.id}`).set(auth(ctx.patient.token))).status).toBe(403);

    const removed = await api().delete(`/api/messages/${sent.body.id}`).set(auth(ctx.caregiver.token));
    expect(removed.status).toBe(204);
    expect((await list(ctx.caregiver.token)).body).toEqual([]);
  });

  it('בלי Token → 401', async () => {
    expect((await api().get('/api/messages')).status).toBe(401);
  });
});
