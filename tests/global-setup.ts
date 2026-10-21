import { execSync } from 'node:child_process';

/**
 * לפני כל הבדיקות: מריץ את ה-Migrations על מסד הבדיקות (פעולה לא הרסנית).
 * כל קובץ בדיקות מנקה את השורות בעצמו (resetDatabase ב-helpers),
 * ולכן חובה שזה יהיה מסד בדיקות נפרד – שמו חייב להכיל "test".
 */
export default function setup() {
  const databaseUrl =
    process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/medtake_test';

  const databaseName = new URL(databaseUrl).pathname.slice(1);
  if (!databaseName.includes('test')) {
    throw new Error(`מסד הבדיקות חייב להיות מסד נפרד ששמו מכיל "test" (קיבלתי: ${databaseName})`);
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
}
