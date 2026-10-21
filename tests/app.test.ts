import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { apiRouter } from '../src/routes';
import { openApiDocument } from '../src/docs/openapi';
import { api } from './helpers';

afterAll(() => prisma.$disconnect());

describe('Health', () => {
  it('GET /api/health מחזיר ok כולל מסד', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'ok' });
  });

  it('נתיב לא קיים → 404 בפורמט אחיד', async () => {
    const res = await api().get('/api/nothing-here');
    expect(res.status).toBe(404);
    expect(res.body.statusCode).toBe(404);
  });
});

describe('כל נתיב פרטי דורש Token', () => {
  const PUBLIC = ['GET /api/health', 'POST /api/auth/register', 'POST /api/auth/login'];
  type Layer = { route?: { path: string; methods: Record<string, boolean> } };
  const routes = (apiRouter.stack as Layer[])
    .filter((layer) => layer.route)
    .flatMap((layer) => Object.keys(layer.route!.methods).map((method) => ({ method, path: layer.route!.path })))
    .filter(({ method, path }) => !PUBLIC.includes(`${method.toUpperCase()} /api${path}`));

  it.each(routes)('$method $path בלי Token → 401', async ({ method, path }) => {
    const url = `/api${path.replace(':id', '00000000-0000-4000-8000-000000000000')}`;
    const res = await (api() as unknown as Record<string, (u: string) => Promise<{ status: number }>>)[method](url);
    expect(res.status).toBe(401);
  });
});

describe('CORS', () => {
  it('מאפשר את כתובת הלקוח מה-ENV', async () => {
    const res = await api().get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('לא מאפשר כתובת אחרת', async () => {
    const res = await api().get('/api/health').set('Origin', 'http://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('Swagger', () => {
  it('/api-docs מחזיר את ממשק Swagger UI', async () => {
    const res = await api().get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger');
  });

  it('/api-docs.json הוא OpenAPI 3 עם Bearer', async () => {
    const res = await api().get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.components.securitySchemes.bearerAuth).toMatchObject({ type: 'http', scheme: 'bearer' });
  });

  it('כל נתיב שקיים בשרת מתועד ב-Swagger', () => {
    type Layer = { route?: { path: string; methods: Record<string, boolean> } };
    const routes = (apiRouter.stack as Layer[])
      .filter((layer) => layer.route)
      .flatMap((layer) =>
        Object.keys(layer.route!.methods).map((method) => ({
          method,
          path: `/api${layer.route!.path.replace(/:(\w+)/g, '{$1}')}`,
        })),
      );
    expect(routes.length).toBeGreaterThan(15);

    const paths = openApiDocument.paths as Record<string, Record<string, unknown>>;
    for (const { method, path } of routes) {
      expect(paths[path], `${method.toUpperCase()} ${path} חסר ב-Swagger`).toBeDefined();
      expect(paths[path][method], `${method.toUpperCase()} ${path} חסר ב-Swagger`).toBeDefined();
    }
  });

  it('כל ה-$ref מצביעים על סכמות קיימות', () => {
    const text = JSON.stringify(openApiDocument);
    const refs = [...text.matchAll(/#\/components\/schemas\/(\w+)/g)].map((m) => m[1]);
    const schemas = Object.keys(openApiDocument.components.schemas);
    for (const name of new Set(refs)) expect(schemas).toContain(name);
  });
});
