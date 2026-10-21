// משתני סביבה לבדיקות – מסד נפרד (medtake_test), כדי לא לגעת בנתוני הפיתוח
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/medtake_test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-jwt-signing-123';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'http://localhost:5173';
