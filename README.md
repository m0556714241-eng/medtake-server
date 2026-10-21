# MedTake – שרת API למעקב נטילת תרופות

שרת Node.js עבור אפליקציית MedTake. **מטפל** מנהל מטופלים ומרשמים, ו**מטופל** מסמן אילו תרופות לקח. השרת מחשב בעצמו אילו מנות ממתינות ואילו פוספסו, מנהל את המלאי ושולח התראה כשהמלאי נמוך.

> בפעם הראשונה שאת מעלה את השרת לאינטרנט? התחילי מ-[START-HERE.md](START-HERE.md).
> כותבת את צד ה-React? המדריך שלך הוא [docs/FRONTEND-API-GUIDE.md](docs/FRONTEND-API-GUIDE.md).

## ☀️ התחלה מהירה: הפעלת השרת בפעם הראשונה

כל השלבים לפי הסדר. עוברים לשלב הבא רק אחרי שהשלב הקודם הצליח.

**שלב 1: מסד נתונים ב-Render** (פעם אחת, בערך 5 דקות)
עוברים על [START-HERE.md](START-HERE.md), **חלק ב**. בסופו יש לך שתי כתובות: **Internal Database URL** ו-**External Database URL**.

**שלב 2: התקנת החבילות.** בטרמינל של VS Code:
```
cd D:\Users\User\Desktop\medtake-server
npm install
```
צריך להסתיים בלי `ERR!`. אזהרות (`warn`) הן תקינות.

**שלב 3: קובץ הגדרות**
```
copy .env.example .env
```
פותחים את `.env` ב-VS Code ומשנים:
- `DATABASE_URL` = ה-**External Database URL** מ-Render, בין המירכאות.
- `JWT_SECRET` = מחרוזת ארוכה כלשהי, לפחות 32 תווים, בלי רווחים.

שאר השורות נשארות כמו שהן. שומרים (Ctrl+S).

**שלב 4: יצירת הטבלאות ונתוני הדגמה**
```
npm run db:deploy
npm run db:seed
```
בסוף צריכה להופיע השורה `Seed הסתיים: 3 מטפלים, 5 מטופלים...`.

**שלב 5: הפעלת השרת**
```
npm run dev
```
צריכה להופיע השורה `MedTake API פועל על פורט 3000`. משאירים את הטרמינל פתוח.

**שלב 6: בדיקה בדפדפן**
- http://localhost:3000/api/health צריך להחזיר `"status":"ok"`.
- http://localhost:3000/api-docs פותח את Swagger. מתחברים עם `rachel@medtake.dev` / `Medtake123`, לפי ההוראות שבראש עמוד ה-Swagger.

**שלב 7 (כשמוכנים): העלאה לאינטרנט.** לפי [START-HERE.md](START-HERE.md), חלקים א, ג ו-ד.

> נתקעת? הטבלה "כשהשרת לא עולה" בסוף הקובץ, וטבלת התקלות ב-START-HERE.

## טכנולוגיות
Node.js 22, Express 5, TypeScript (strict), PostgreSQL, Prisma 6, Zod, JWT, bcrypt, Swagger (OpenAPI 3), Vitest.

## הרצה מקומית

**דרישות:** Node.js 20 ומעלה, ו-PostgreSQL: מקומי, או מסד בענן (Render / Neon, ראו START-HERE).

```bash
npm install
cp .env.example .env          # ב-Windows: copy .env.example .env
# עורכים את .env: DATABASE_URL ו-JWT_SECRET
npm run db:deploy             # יוצר את הטבלאות
npm run db:seed               # מוסיף נתוני הדגמה
npm run dev                   # השרת עולה ב-http://localhost:3000
```

| כתובת | מה יש שם |
|---|---|
| http://localhost:3000/api/health | בדיקת תקינות |
| http://localhost:3000/api-docs | Swagger |
| http://localhost:3000/api-docs.json | קובץ OpenAPI (עותק נמצא גם ב-`docs/openapi.json`) |

הלקוח (React + Vite) רץ בדרך כלל על פורט 5173, והכתובת הזו כבר מוגדרת ב-`CORS_ORIGIN`.

## משתני סביבה

| משתנה | חובה | הסבר |
|---|---|---|
| `DATABASE_URL` | ✅ | כתובת החיבור ל-PostgreSQL |
| `JWT_SECRET` | ✅ | מחרוזת סודית, לפחות 32 תווים |
| `JWT_EXPIRES_IN` | | תוקף ה-Token. ברירת מחדל: `7d` |
| `PORT` | | ברירת מחדל: 3000. ב-Render הערך נקבע אוטומטית |
| `CORS_ORIGIN` | | כתובות הלקוח המורשות, מופרדות בפסיק. ברירת מחדל: `http://localhost:5173` |
| `NODE_ENV` | | `development` / `production` / `test` |
| `SEED_PASSWORD` | בפרודקשן | הסיסמה של משתמשי ההדגמה |

אם חסר משתנה חובה, השרת לא עולה ומדפיס הודעה שמסבירה מה חסר.

## משתמשי הדגמה (אחרי `npm run db:seed`)

הסיסמה של כולם היא `Medtake123` (או מה שהוגדר ב-`SEED_PASSWORD`).

| תפקיד | מייל | מטופלים |
|---|---|---|
| מטפל | rachel@medtake.dev | אברהם כהן (avraham@), מרים כהן (miriam@) |
| מטפל | david@medtake.dev | שמואל לוי (shmuel@), יעקב לוי (yaakov@) |
| מטפל | noa@medtake.dev | משה פרידמן (moshe@) |

כל המטופלים נמצאים תחת `@medtake.dev`. הנתונים כוללים מרשמים פעילים, מושהים ומסתיימים, צורות שונות, היסטוריית נטילה של שבועיים, ומרשמים במלאי נמוך (אצל אברהם, שמואל ומשה).

## פקודות

| פקודה | מה היא עושה |
|---|---|
| `npm run dev` | הרצה בפיתוח, עם טעינה מחדש בכל שינוי |
| `npm run build` | Prisma Generate והידור ל-`dist/` |
| `npm start` | הרצת הגרסה המהודרת |
| `npm run start:prod` | Migrations ואז הרצה. זו הפקודה שמשמשת ב-Render |
| `npm run typecheck` | בדיקת TypeScript |
| `npm test` | בדיקות אוטומטיות. דורש מסד בדיקות, ראו בהמשך |
| `npm run db:migrate` | יצירת Migration חדש אחרי שינוי ב-`schema.prisma` |
| `npm run db:deploy` | הרצת ה-Migrations הקיימים |
| `npm run db:seed` | נתוני הדגמה. בטוח להרצה חוזרת, נוגע רק במשתמשי `@medtake.dev` |
| `npm run openapi` | שמירת התיעוד ל-`docs/openapi.json` |

## בדיקות

הבדיקות רצות מול מסד PostgreSQL אמיתי ונפרד, שמתאפס בכל הרצה. ברירת המחדל היא `postgresql://postgres:postgres@localhost:5432/medtake_test`, ואפשר לשנות אותה עם `TEST_DATABASE_URL`.

```bash
TEST_DATABASE_URL="postgresql://..." npm test
```

**אל תכווני את `TEST_DATABASE_URL` למסד האמיתי, כי הוא נמחק בכל הרצה.**

## מבנה הפרויקט

```
src/
  config/        משתני סביבה ואזור זמן
  db/            חיבור Prisma
  routes/        כל הנתיבים והרשאות התפקיד שלהם (קובץ אחד – קל לראות הכול)
  controllers/   קבלת הבקשה, ולידציה, החזרת תשובה
  services/      הלוגיקה: הרשאות בעלות, חישוב מנות, מלאי
  schemas/       סכמות Zod לולידציה
  middleware/    אימות JWT, בדיקת תפקיד, טיפול בשגיאות
  utils/         תאריכים, המרות לתשובות API, שגיאות HTTP
  docs/          תיעוד OpenAPI
prisma/          סכמה, Migrations, Seed
tests/           בדיקות Vitest + Supertest
docs/            מדריך ל-React, openapi.json
```

## איך זה עובד: מושגים

- **מרשם (Prescription)** הוא התוכנית: תרופה, מינון, באילו ימים ובאילו שעות. המרשם נשמר במסד.
- **מנה (Dose)** היא פעם אחת מתוך התוכנית: תרופה מסוימת ביום מסוים ובשעה מסוימת. מנות **לא נשמרות** במסד; השרת מחשב אותן מלוח הזמנים בכל בקשה.
- **רשומת נטילה (IntakeLog)** היא הסימון "לקחתי", ונשמרת רק למנות שסומנו.
  - מנה שיש לה רשומה מקבלת את הסטטוס `taken`.
  - מנה בלי רשומה, שעבר זמנה ועברו גם `missedAfterMinutes` דקות, מקבלת את הסטטוס `missed`.
  - כל מנה אחרת מקבלת את הסטטוס `pending`.
- **מלאי:**
  - סימון מנה מוריד מהמלאי `unitsPerDose`, אבל המלאי לא יורד מתחת ל-0.
  - ביטול הסימון מחזיר בדיוק את הכמות שירדה.
  - מרשם נחשב במלאי נמוך כש-`stockQuantity <= lowStockThreshold`.
- **אזור זמן:** כל החישובים נעשים לפי שעון ישראל (`Asia/Jerusalem`), כולל המעבר לשעון חורף.

## אבטחה והרשאות
- סיסמאות נשמרות כ-hash של bcrypt, והן או ה-hash לא מוחזרים באף תשובה.
- המשתמש מזוהה **רק** לפי ה-Token, ולעולם לא לפי מזהה שנשלח בבקשה.
- בקשה בלי Token, או עם Token לא תקין או שפג תוקפו, מחזירה 401.
- פעולה שהתפקיד לא מורשה לה מחזירה 403. למשל: מטופל שמנסה ליצור מרשם, או מטפל שמנסה לסמן נטילה.
- ניסיון לגשת למטופל או למרשם של משתמש אחר מחזיר 404, כדי לא לחשוף שהרשומה קיימת.
- המסד אוכף גם הוא כמה כללים: מייל ייחודי, מטופל חייב מטפל, מלאי לא שלילי, תאריך סיום לא לפני תאריך התחלה, ומנה לא נרשמת פעמיים.

## כשהשרת לא עולה
| הודעה | פתרון |
|---|---|
| `משתני סביבה חסרים או לא תקינים` | בדקי שקובץ `.env` קיים ומכיל `DATABASE_URL`, ושה-`JWT_SECRET` ארוך מספיק (לפחות 32 תווים) |
| `P1001: Can't reach database server` | הכתובת שגויה. מהמחשב צריך להשתמש ב-**External** Database URL של Render (לא Internal). נסי להוסיף `?sslmode=require` בסוף הכתובת |
| `The table ... does not exist` | עוד לא נוצרו טבלאות. הריצי `npm run db:deploy` |
| `EADDRINUSE` | הפורט תפוס. סגרי את השרת הקודם, או שני את `PORT` |
| שגיאת CORS בדפדפן | הוסיפי את כתובת הלקוח ל-`CORS_ORIGIN` והפעילי את השרת מחדש |

פתרון תקלות מורחב נמצא ב-[START-HERE.md](START-HERE.md).
