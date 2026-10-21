# MedTake – מדריך API לצד ה-React

המדריך מסביר מה הלקוח שולח לשרת ומה חוזר ממנו. קוד React הוא שלך. כאן יש רק את החוזה מול השרת.

## 1. כתובת הבסיס

| סביבה | Base URL |
|---|---|
| פיתוח | `http://localhost:3000/api` |
| ענן | `https://<שם-השירות>.onrender.com/api` |

הכתובת נשמרת בצד הלקוח ב-`.env`, במשתנה שמתחיל ב-`VITE_`, למשל `VITE_API_URL`. אחרי שינוי ב-`.env` צריך להפעיל מחדש את `npm run dev`.

תיעוד חי ובדיקה ידנית של כל נתיב: `http://localhost:3000/api-docs`.

## 2. התחברות ו-Token

1. `POST /auth/login` או `POST /auth/register` מחזירים `{ token, user }`.
2. את ה-`token` שומרים, למשל ב-localStorage ובקונטקסט.
3. בכל בקשה מוגנת שולחים את הכותרת:
   ```
   Authorization: Bearer <token>
   ```
4. כשהאתר נטען מחדש ויש Token שמור, קוראים ל-`GET /auth/me` כדי לקבל את המשתמש מחדש. אם חוזר 401, ה-Token לא תקף: מוחקים אותו ומעבירים לעמוד הכניסה.
5. Logout מתבצע בצד הלקוח בלבד: מוחקים את ה-Token ומאפסים את המשתמש. אין נתיב Logout בשרת.

לפי `user.role` מחליטים מה להציג: `caregiver` רואה את "ניהול", ו-`patient` רואה את "התרופות שלי".

## 3. פורמט שגיאה (תמיד אותו מבנה)

```json
{ "message": "הנתונים שנשלחו אינם תקינים", "statusCode": 400, "errors": { "email": "כתובת מייל לא תקינה" } }
```

- `message` היא הודעה כללית בעברית, שאפשר להציג למשתמש כמו שהיא.
- `errors` מופיע רק בשגיאות ולידציה (400). המפתח הוא שם השדה, ובשדות מקוננים הוא נכתב עם נקודה, למשל `schedule.times.0`. אפשר להציג את ההודעה ליד השדה המתאים בטופס.

| קוד | מתי | מה כדאי לעשות בלקוח |
|---|---|---|
| 200 / 201 | הצלחה | להציג את המידע, או הודעת הצלחה |
| 204 | מחיקה או ביטול הצליחו, בלי תוכן בתשובה | לרענן את הרשימה |
| 400 | נתונים לא תקינים | להציג את ההודעות מתוך `errors` ליד השדות |
| 401 | אין Token, או שהוא לא תקין או פג תוקפו (בהתחברות: מייל או סיסמה שגויים) | להעביר לעמוד הכניסה (בהתחברות: להציג את ההודעה) |
| 403 | אין הרשאה לתפקיד | להציג "אין הרשאה". בדרך כלל זה סימן לבאג בתפריט |
| 404 | לא נמצא, או שייך למשתמש אחר | להציג "לא נמצא" |
| 409 | התנגשות: מייל קיים, או מנה שכבר סומנה | להציג את `message` |
| 500 / 503 | תקלה בשרת או במסד | להציג "שגיאה, נסי שוב" |

## 4. איזה נתיב לכל מסך

### עמוד כניסה (`Entrance`)
| פעולה | נתיב | גוף הבקשה (שדות חובה) | תשובה |
|---|---|---|---|
| התחברות | `POST /auth/login` | `email`, `password` | `AuthResponse` |
| הרשמה (תמיד כמטפל) | `POST /auth/register` | `fullName` (2–100), `email`, `password` (לפחות 8 תווים, אות וספרה) | `AuthResponse` (201) |

אם נשלח `role`, השרת מתעלם ממנו. כל מי שנרשם הוא מטפל.

### Header
| מה | נתיב |
|---|---|
| שם המשתמש | מגיע מ-`user` שבקונטקסט |
| התראות מלאי נמוך | `GET /alerts/low-stock` → `LowStockAlert[]` |

### עמוד ניהול (`Manager`, מטפל)
| פעולה | נתיב | הערות |
|---|---|---|
| רשימת מטופלים | `GET /patients` | Query: `search`, `sortBy` = `fullName` / `createdAt`, `sortOrder` = `asc` / `desc`, `lowStock=true`, `missedToday=true` |
| הוספת מטופל (`AddPatient`) | `POST /patients` | `CreatePatientRequest`: `fullName`, `email`, `password`, `birthDate` (YYYY-MM-DD). תשובה: `User` (201) |
| מילוי טופס עריכה | `GET /patients/:id` | `PatientSummary` |
| עריכת מטופל | `PUT /patients/:id` | `UpdatePatientRequest`. כש-`password` ריק או חסר, הסיסמה לא משתנה |
| מחיקת מטופל | `DELETE /patients/:id` | 204. נמחקים גם כל המרשמים וההיסטוריה של המטופל |

הכרטיס של כל מטופל משתמש בשדות: `fullName`, `age`, `createdAt` (תאריך ההצטרפות), `todayTaken`/`todayTotal`, `todayMissed` ו-`hasLowStock`.

### עמוד מטופל בודד (מטפל)
| פעולה | נתיב | הערות |
|---|---|---|
| פרופיל | `GET /patients/:id` | `PatientSummary`, כולל `activePrescriptions` |
| מנות היום | `GET /doses?from=<היום>&to=<היום>&patientId=<id>` | `Dose[]`. המטפל לא מסמן |
| רשימת מרשמים | `GET /prescriptions?patientId=<id>` | Query: `search`, `status`, `form`, `sortBy` = `drugName` / `startDate` / `stockQuantity`, `sortOrder` |
| הוספת מרשם (`AddMedicine`) | `POST /prescriptions` | `PrescriptionFormValues` כולל `patientId`. תשובה: `Prescription` (201) |
| מילוי טופס עריכה | `GET /prescriptions/:id` | |
| עריכת מרשם | `PUT /prescriptions/:id` | אותו גוף. השרת מתעלם מ-`patientId` |
| השהיה, סיום או הפעלה | `PATCH /prescriptions/:id/status` | `{ "status": "paused" }` |
| חידוש מלאי (`RefillStock`) | `POST /prescriptions/:id/refill` | `{ "quantity": 30 }` (1–10000). הכמות **מתווספת** למלאי |
| מחיקה (רק למרשם שנוצר בטעות) | `DELETE /prescriptions/:id` | 204 |

### התרופות שלי (`MyMedicines`, מטופל)
| פעולה | נתיב | הערות |
|---|---|---|
| תצוגה יומית (`DailyMedicine`) | `GET /doses?from=<יום>&to=<אותו יום>` | מטופל לא שולח `patientId` |
| תצוגה שבועית (`WeeklyMedicine`) | `GET /doses/summary?from=<ראשון>&to=<שבת>` | `DaySummary[]`, 7 פריטים |
| סימון "נלקח" | `POST /intakes` | `{ prescriptionId, scheduledAt }`. את שני הערכים מעתיקים **בדיוק** מה-`Dose` |
| ביטול סימון | `DELETE /intakes/:intakeId` | את `intakeId` לוקחים מה-`Dose` |
| התראת מלאי | `GET /alerts/low-stock`, או השדה `isLowStock` שבכל `Dose` | |

הסרגל "נלקחו X מתוך Y" מחושב בלקוח: מספר המנות עם `status === 'taken'`, מתוך האורך של הרשימה.

**אחרי סימון או ביטול** צריך לבקש מחדש את המנות של אותו יום, ואם צריך גם את הסיכום השבועי וההתראות. ב-React Query עושים את זה עם invalidate למפתחות המתאימים.

## 5. מבני הנתונים (תואמים לתיקיית `src/types` שלך)

### User
```json
{
  "id": "6f1c…", "fullName": "אברהם כהן", "email": "avraham@medtake.dev",
  "role": "patient", "caregiverId": "1a2b…", "birthDate": "1944-05-12",
  "createdAt": "2026-09-01T09:05:00.000Z"
}
```
אצל מטפל, `caregiverId` ו-`birthDate` הם `null`.

### AuthResponse
```json
{ "token": "eyJhbGciOi…", "user": { "...": "User" } }
```

### PatientSummary (User ועוד שדות מחושבים)
```json
{ "...": "כל שדות User", "age": 82, "activePrescriptions": 3,
  "todayTotal": 5, "todayTaken": 2, "todayMissed": 1, "hasLowStock": true }
```

### Prescription
```json
{
  "id": "…", "patientId": "…", "createdBy": "…",
  "drugName": "אקמול", "dosage": "500 מ\"ג", "form": "tablet", "unitsPerDose": 1,
  "schedule": { "days": [0,1,2,3,4,5,6], "times": ["08:00", "20:00"] },
  "startDate": "2026-10-01", "endDate": null, "instructions": "אחרי האוכל",
  "missedAfterMinutes": 60, "stockQuantity": 24, "lowStockThreshold": 5,
  "status": "active", "isLowStock": false,
  "createdAt": "2026-10-01T07:00:00.000Z", "updatedAt": "2026-10-01T07:00:00.000Z"
}
```

### טופס מרשם: מה חובה
| שדה | חובה | כלל |
|---|---|---|
| `patientId` | ✅ ביצירה | UUID של מטופל שלך |
| `drugName` | ✅ | 1–100 תווים |
| `dosage` | ✅ | 1–50 תווים |
| `form` | ✅ | `tablet` / `capsule` / `syrup` / `drops` / `injection` / `cream` / `other` |
| `unitsPerDose` | ✅ | מספר שלם 1–100 |
| `schedule.days` | ✅ | לפחות יום אחד, 0 (ראשון) עד 6 (שבת), בלי כפילויות |
| `schedule.times` | ✅ | 1–12 שעות `HH:mm`, בלי כפילויות |
| `startDate` | ✅ | `YYYY-MM-DD` |
| `endDate` | | `YYYY-MM-DD` או `null`. לא לפני `startDate` |
| `instructions` | | עד 500 תווים |
| `missedAfterMinutes` | | 5–720. ברירת מחדל: 60 |
| `stockQuantity` | ✅ | מספר שלם ≥ 0 |
| `lowStockThreshold` | ✅ | מספר שלם ≥ 0 |
| `status` | | ברירת מחדל: `active` |

שימי לב שמספרים צריכים להישלח כ-**number** ולא כמחרוזת. ב-React Hook Form יש לכך אפשרות `valueAsNumber`.

### Dose
```json
{
  "prescriptionId": "…", "drugName": "אקמול", "dosage": "500 מ\"ג", "form": "tablet",
  "unitsPerDose": 1, "scheduledAt": "2026-10-21T08:00:00+03:00",
  "status": "taken", "takenAt": "2026-10-21T08:12:00+03:00",
  "intakeId": "…", "isLowStock": false
}
```
- `status` הוא `pending` (ממתין), `taken` (נלקח) או `missed` (פוספס).
- `intakeId` ו-`takenAt` הם `null` כשהמנה לא סומנה.
- המנות מגיעות ממוינות לפי שעה.
- כמפתח (`key`) לרשימה אפשר להשתמש בצירוף `prescriptionId + scheduledAt`, כי הוא ייחודי.

### DaySummary
```json
{ "date": "2026-10-21", "total": 4, "taken": 3, "missed": 1, "pending": 0 }
```

### IntakeLog (התשובה לסימון)
```json
{ "id": "…", "prescriptionId": "…", "patientId": "…",
  "scheduledAt": "2026-10-21T08:00:00+03:00", "takenAt": "2026-10-21T08:12:00+03:00", "note": null }
```

### LowStockAlert
```json
{ "prescriptionId": "…", "drugName": "אקמול", "patientId": "…", "patientName": "אברהם כהן",
  "stockQuantity": 2, "lowStockThreshold": 5 }
```

## 6. תאריכים
- תאריך בלי שעה נכתב כ-`YYYY-MM-DD`. דוגמאות: `birthDate`, `startDate`, `from`, `to`.
- זמן של מנה נכתב בפורמט ISO עם היסט שעון ישראל: `2026-10-21T08:00:00+03:00`, ובחורף `+02:00`.
- ה-"היום" שאת שולחת ב-`from`/`to` צריך להיות לפי שעון ישראל. אם נעזרים ב-`toISOString()` בלבד, חצות עלול ליפול על היום הקודם, אז צריך לבנות את התאריך מהשנה, החודש והיום המקומיים.
- שבוע מתחיל ביום ראשון (0) ומסתיים בשבת (6).
- טווח מקסימלי לבקשה אחת הוא 31 ימים.

## 7. הרשאות בקצרה

| נתיב | מטפל | מטופל |
|---|---|---|
| `/patients/*` | ✅ רק שלו | ❌ 403 |
| `GET /prescriptions*` | ✅ עם `patientId` של מטופל שלו | ✅ רק שלו |
| שינוי מרשמים | ✅ | ❌ 403 |
| `GET /doses*` | ✅ עם `patientId` | ✅ רק שלו |
| `/intakes` | ❌ 403 | ✅ רק שלו |
| `/alerts/low-stock` | ✅ של כל המטופלים שלו | ✅ שלו |

## 8. משתמשי הדגמה
מטפלת: `rachel@medtake.dev`. מטופל שלה: `avraham@medtake.dev`. הסיסמה של שניהם: `Medtake123`. רשימה מלאה נמצאת ב-README.
