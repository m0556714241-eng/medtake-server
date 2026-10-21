# מתחילים כאן: להעלות את MedTake לאינטרנט

המדריך מיועד למי שמעולם לא העלתה שרת לאינטרנט. עוברים עליו לפי הסדר.

**בסוף התהליך יהיו לך:**
1. הקוד ב-**GitHub**.
2. מסד נתונים PostgreSQL חינמי ב-**Render**.
3. השרת עצמו ב-**Render**, בכתובת כמו `https://medtake-api.onrender.com`.

> ⚠️ **שימי לב:** אתרים משנים מדי פעם את שמות הכפתורים והמסכים. השמות כאן נכונים למועד הכתיבה, אבל ייתכנו הבדלים קטנים. אם כפתור לא נמצא בדיוק במקום, חפשי כפתור עם שם דומה.
>
> ⚠️ **סינון אינטרנט (כמו NetFree):** ייתכן שאתרים מסוימים, ובהם הכתובת של השרת שלך ב-Render, ייחסמו. במקרה כזה צריך לבקש מספק הסינון לפתוח את הכתובת.

---

## חלק א: GitHub (שמירת הקוד)

1. **פתיחת חשבון:** נכנסים ל-https://github.com, לוחצים **Sign up**, ממלאים מייל, סיסמה ושם משתמש, ומאשרים את המייל.
2. **יצירת Repository:** לוחצים **+** למעלה מימין ובוחרים **New repository**.
   - **Repository name:** `medtake-server`
   - בוחרים **Private** או **Public**. אם המורה צריך לראות את הקוד, Public פשוט יותר, או Private עם הזמנה למורה.
   - **לא** מסמנים "Add a README", כי כבר יש README בפרויקט.
   - לוחצים **Create repository**.
3. **חילוץ ה-ZIP:** במחשב, לחיצה ימנית על קובץ ה-ZIP ובחירה ב-**חלץ הכול / Extract All**. נוצרת תיקייה `medtake-server`.
4. **העלאת הקבצים דרך הדפדפן:**
   - בעמוד ה-Repository החדש לוחצים על הקישור **uploading an existing file**.
   - פותחים את התיקייה `medtake-server`, מסמנים את **כל מה שבתוכה** (Ctrl+A) וגוררים לחלון הדפדפן. מעלים את התוכן של התיקייה, לא את התיקייה עצמה.
   - חשוב לוודא שהועלו גם הקבצים שמתחילים בנקודה: `.gitignore` ו-`.env.example`. ב-Windows הם גלויים כרגיל.
   - למטה לוחצים **Commit changes**.
5. **בדיקה:** בעמוד הראשי של ה-Repository צריכים להופיע `src`, `prisma`, `tests`, `docs`, `package.json`, `render.yaml` ו-`README.md`. **אסור** שיופיעו `node_modules` או קובץ `.env`.

> אם את מכירה את Git ממסוף הפקודות, אפשר כמובן להשתמש ב-`git init`, `git add .`, `git commit` ו-`git push`.

---

## חלק ב: מסד נתונים ב-Render

> ⚠️ **חשוב:** מסד PostgreSQL חינמי ב-Render **נמחק 30 יום אחרי שנוצר**, ויש אחר כך 14 ימי חסד לשדרוג. לכן כדאי ליצור אותו קרוב למועד ההגשה. אם צריך מסד שנשאר יותר זמן, ראי "חלופה: Neon" בסוף החלק הזה.

1. **פתיחת חשבון:** נכנסים ל-https://render.com, לוחצים **Get Started**, ונרשמים עם חשבון **GitHub**.
2. **יצירת מסד:** בלוח הבקרה לוחצים **+ New** ובוחרים **Postgres**. ממלאים:

   | שדה | ערך |
   |---|---|
   | **Name** | `medtake-db` |
   | **Database** | `medtake` |
   | **User** | `medtake` |
   | **Region** | Frankfurt (EU Central). **חייב להיות אותו אזור שבו ייווצר השרת** |
   | **PostgreSQL Version** | ברירת המחדל |
   | **Instance Type / Plan** | **Free** |

   לוחצים **Create Database**, ומחכים דקה-שתיים עד שהסטטוס יהיה **Available**.
3. **קבלת Connection String:** בעמוד המסד, בחלק **Connections**, יש שתי כתובות:
   - **Internal Database URL:** בשביל השרת ב-Render. היא עובדת רק מתוך Render.
   - **External Database URL:** בשביל המחשב שלך, להרצה מקומית ול-Seed. אם יש שגיאת חיבור, מוסיפים בסוף הכתובת `?sslmode=require`.

   מעתיקים כל אחת עם כפתור ההעתקה שלידה.
4. **שמירה בטוחה:** הכתובות מכילות סיסמה. שומרים אותן במקום פרטי. **לא** מעלים אותן ל-GitHub ולא שולחים אותן לאף אחד.
5. **חיבור השרת למסד:**
   - **בשרת ב-Render** (חלק ג): משתנה `DATABASE_URL` = **Internal Database URL**.
   - **במחשב שלך:** בקובץ `.env`, משתנה `DATABASE_URL` = **External Database URL**.

   הטבלאות ייווצרו אוטומטית כשהשרת יעלה.

### חלופה: Neon (מסד שלא נמחק אחרי 30 יום)
1. נכנסים ל-https://neon.com, לוחצים **Sign up**, ויוצרים פרויקט בשם `medtake` באזור Frankfurt.
2. לוחצים **Connect**, **מכבים** את **Connection pooling**, ומעתיקים את הכתובת.
3. מוסיפים בסוף הכתובת `&connect_timeout=15`.
4. משתמשים באותה כתובת גם ב-Render וגם ב-`.env` שבמחשב.

---

## חלק ג: השרת ב-Render

1. **פתיחת חשבון:** נכנסים ל-https://render.com, לוחצים **Get Started**, ונרשמים עם חשבון **GitHub**. זה מחבר את Render ל-GitHub בצעד אחד.
2. **חיבור GitHub:** אם Render מבקש גישה ל-Repositories, מאשרים, ואפשר לבחור רק את `medtake-server`.
3. **יצירת Web Service:** בלוח הבקרה לוחצים **+ New** ובוחרים **Web Service**.
4. **בחירת Repository:** בוחרים את `medtake-server` ולוחצים **Connect**.
5. **הגדרות Build ו-Start:** ממלאים בדיוק כך:

   | שדה | ערך |
   |---|---|
   | **Name** | `medtake-api` (זה גם יהיה חלק מהכתובת) |
   | **Region** | Frankfurt (EU Central) |
   | **Branch** | `main` |
   | **Runtime / Language** | Node |
   | **Build Command** | `npm ci --include=dev && npm run build` |
   | **Start Command** | `npm run start:prod` |
   | **Instance Type** | Free |

6. **משתני סביבה:** באותו מסך, בחלק **Environment Variables**, לוחצים **Add Environment Variable** ומוסיפים:

   | Key | Value |
   |---|---|
   | `NODE_VERSION` | `22` |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | ה-**Internal Database URL** של המסד מחלק ב |
   | `JWT_SECRET` | מחרוזת אקראית ארוכה. אפשר ללחוץ על **Generate**, אם הכפתור מופיע, או להקליד לפחות 40 תווים אקראיים |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CORS_ORIGIN` | הכתובת של אתר ה-React. כרגע `http://localhost:5173`. אחרי שתעלי את הלקוח, מוסיפים אותו עם פסיק, למשל `http://localhost:5173,https://medtake-client.onrender.com` |

7. **Prisma Migrations:** אין צורך לעשות שום דבר. הפקודה `npm run start:prod` מריצה `prisma migrate deploy` לפני שהשרת עולה, וכך הטבלאות נוצרות או מתעדכנות בכל Deploy.
8. **Deploy:** לוחצים **Deploy Web Service** (או **Create Web Service**), ומחכים כמה דקות. בלוגים צריכה להופיע השורה `MedTake API פועל על פורט ...`.
9. **בדיקה שהשרת פעיל:** הכתובת מופיעה למעלה, למשל `https://medtake-api.onrender.com`. פותחים בדפדפן את `https://medtake-api.onrender.com/api/health`. צריך לחזור `{"status":"ok","database":"ok",...}`.

> **אפשרות מקוצרת (Blueprint):** בפרויקט יש קובץ `render.yaml`. ב-Render אפשר לבחור **New → Blueprint**, לבחור את ה-Repository, ו-Render ימלא לבד את רוב ההגדרות. את `DATABASE_URL` ואת `CORS_ORIGIN` צריך להדביק ידנית.

### מגבלות המסלול החינמי של Render
- שרת שלא קיבל בקשות 15 דקות "נרדם". הבקשה הראשונה אחרי זה לוקחת כחצי דקה עד דקה, וזה תקין.
- יש מכסה חודשית של שעות ריצה. לפרויקט אחד זה מספיק.
- אם Render לא זמין או שהמסלול החינמי השתנה, חלופות מתאימות הן **Railway** או **Koyeb**. ההגדרות דומות: Build Command, Start Command ומשתני הסביבה מהטבלה.

### נתוני הדגמה בענן
Render החינמי לא מספק מסוף (Shell), ולכן מריצים את ה-Seed מהמחשב שלך מול המסד ב-Render:
1. בתיקיית הפרויקט במחשב יוצרים קובץ `.env`, עם `DATABASE_URL` = ה-**External Database URL**, `JWT_SECRET` כלשהו (לפחות 32 תווים) ו-`SEED_PASSWORD`. בפרודקשן הסיסמה הזו חובה, ובוחרים אותה בעצמך.
2. מריצים:
   ```bash
   npm install
   npm run db:deploy
   npm run db:seed
   ```
3. משתמשי ההדגמה (`rachel@medtake.dev` ושאר המשתמשים מה-README) יעבדו בענן עם הסיסמה שבחרת.

---

## חלק ד: בדיקה מלאה

1. **`/api/health`:** פותחים את `https://<הכתובת שלך>/api/health`. צריך לחזור `status: ok` ו-`database: ok`.
2. **`/api-docs`:** פותחים את `https://<הכתובת שלך>/api-docs`. מופיע מסך Swagger עם כל הנתיבים.
3. **התחברות מתוך Swagger:** פותחים את `POST /api/auth/login`, לוחצים **Try it out**, ומכניסים:
   ```json
   { "email": "rachel@medtake.dev", "password": "<הסיסמה של ה-Seed>" }
   ```
   ואז לוחצים **Execute**.
4. **קבלת JWT:** בתשובה (200) מעתיקים את הערך של `token`, בלי המירכאות.
5. **Authorize:** למעלה לוחצים על **Authorize** 🔒, מדביקים את ה-Token (בלי המילה Bearer), ולוחצים **Authorize** ואז **Close**.
6. **קריאה לנתיב מוגן:** `GET /api/patients`, אחר כך **Try it out** ו-**Execute**. חוזרת רשימת המטופלים של רחל.
   - בלי Authorize אמור לחזור **401**.
   - עם Token של מטופל, למשל `avraham@medtake.dev`, אמור לחזור **403**.
7. **הוספת רשומה:** `POST /api/prescriptions`, אחר כך **Try it out**. מחליפים את `patientId` במזהה של אברהם מהשלב הקודם, ולוחצים **Execute**. צריך לחזור **201**.
8. **שליפה מהמסד:** `GET /api/prescriptions` עם `patientId` של אברהם. המרשם החדש מופיע ברשימה, כלומר הוא נשמר במסד.

---

## חלק ה: פתרון תקלות

| תקלה | מה רואים | פתרון |
|---|---|---|
| **Build Failed** | הבנייה נכשלת בלוגים של Render | בדקי שה-Build Command הוא בדיוק `npm ci --include=dev && npm run build`, ושהקבצים `package.json` ו-`package-lock.json` נמצאים ב-GitHub. אם כתוב `tsc: not found`, חסר `--include=dev` |
| **DATABASE_URL שגוי** | `P1001: Can't reach database server`, או `Authentication failed` | העתיקי מחדש מעמוד המסד ב-Render, בלי רווחים בהתחלה או בסוף. בשרת ב-Render: Internal URL. במחשב שלך: External URL, ואם צריך עם `?sslmode=require`. ודאי שהמסד והשרת באותו Region |
| **בעיית Prisma** | `The table ... does not exist`, או `P3009 migrate found failed migrations` | ודאי שה-Start Command הוא `npm run start:prod`. ב-P3009: מהמחשב שלך, מול המסד בענן, מריצים `npx prisma migrate resolve --rolled-back 20261021000000_init` ואז Deploy מחדש |
| **JWT_SECRET חסר** | בלוג: `משתני סביבה חסרים או לא תקינים: JWT_SECRET` | הוסיפי ב-Render → Environment משתנה `JWT_SECRET` עם לפחות 32 תווים, ושמרי. Render יעשה Deploy מחדש |
| **שגיאת CORS** | בדפדפן, בקונסול של אתר ה-React: `blocked by CORS policy` | הוסיפי את הכתובת **המדויקת** של הלקוח ל-`CORS_ORIGIN`, כולל `https://` ובלי `/` בסוף. אפשר כמה כתובות מופרדות בפסיק |
| **401** | `חסר Token`, או `ה-Token אינו תקין או שפג תוקפו` | התחברי מחדש. בקוד הלקוח ודאי שהכותרת היא `Authorization: Bearer <token>`, עם רווח אחד. אם `JWT_SECRET` הוחלף, כל ה-Tokens הישנים לא תקפים |
| **403** | `אין לך הרשאה לבצע פעולה זו` | הפעולה לא מתאימה לתפקיד. למשל, מטופל לא יוצר מרשמים ומטפל לא מסמן נטילה. בדקי עם איזה משתמש התחברת |
| **Swagger לא נפתח** | עמוד ריק או 404 ב-`/api-docs` | הכתובת היא `/api-docs`, לא `/api/api-docs`. אם השרת "נרדם", חכי דקה ורענני. אם הכתובת חסומה, ראי את ההערה על סינון בראש המסמך |
| **שרת שלא עולה** | Deploy נכשל, או `Exited with status 1` | פתחי את **Logs** ב-Render וחפשי את ההודעה הראשונה באדום. ברוב המקרים זה משתנה סביבה חסר או `DATABASE_URL` שגוי |
| **הבקשה הראשונה איטית מאוד** | לוקח כדקה | תקין במסלול החינמי. השרת "התעורר" |
