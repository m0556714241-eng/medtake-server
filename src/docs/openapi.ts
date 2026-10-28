/**
 * תיעוד OpenAPI 3 של MedTake API.
 * מוצג ב-Swagger UI בכתובת /api-docs, וכ-JSON בכתובת /api-docs.json.
 */

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object, example?: unknown) => ({
  'application/json': example === undefined ? { schema } : { schema, example },
});

const errorExamples: Record<number, { description: string; message: string }> = {
  400: { description: 'נתונים לא תקינים', message: 'הנתונים שנשלחו אינם תקינים' },
  401: { description: 'אין Token או שהוא לא תקין', message: 'חסר Token – יש להתחבר למערכת' },
  403: { description: 'אין הרשאה לתפקיד הזה', message: 'אין לך הרשאה לבצע פעולה זו' },
  404: { description: 'לא נמצא (או שייך למשתמש אחר)', message: 'המשאב המבוקש לא נמצא' },
  409: { description: 'התנגשות', message: 'הרשומה כבר קיימת' },
};

const errors = (...codes: number[]) =>
  Object.fromEntries(
    codes.map((code) => [
      code,
      {
        description: errorExamples[code].description,
        content: json(ref('ApiError'), { message: errorExamples[code].message, statusCode: code }),
      },
    ]),
  );

const ok = (description: string, schema: object, example?: unknown) => ({
  description,
  content: json(schema, example),
});

const bearer = [{ bearerAuth: [] }];

const idParam = (description: string) => ({
  name: 'id',
  in: 'path',
  required: true,
  description,
  schema: { type: 'string', format: 'uuid' },
});

const queryParam = (name: string, description: string, schema: object, required = false) => ({
  name,
  in: 'query',
  required,
  description,
  schema,
});

// ===== דוגמאות =====
const exampleCaregiver = {
  id: '6f1c2a3b-1111-4a5b-9c0d-000000000001',
  fullName: 'רחל כהן',
  email: 'rachel@medtake.dev',
  role: 'caregiver',
  caregiverId: null,
  birthDate: null,
  createdAt: '2026-09-01T09:00:00.000Z',
};

const examplePatient = {
  id: '6f1c2a3b-2222-4a5b-9c0d-000000000002',
  fullName: 'אברהם כהן',
  email: 'avraham@medtake.dev',
  role: 'patient',
  caregiverId: exampleCaregiver.id,
  birthDate: '1944-05-12',
  createdAt: '2026-09-01T09:05:00.000Z',
};

const examplePrescription = {
  id: '6f1c2a3b-3333-4a5b-9c0d-000000000003',
  patientId: examplePatient.id,
  createdBy: exampleCaregiver.id,
  drugName: 'אקמול',
  dosage: '500 מ"ג',
  form: 'tablet',
  unitsPerDose: 1,
  schedule: { days: [0, 1, 2, 3, 4, 5, 6], times: ['08:00', '20:00'] },
  startDate: '2026-10-01',
  endDate: null,
  instructions: 'אחרי האוכל',
  missedAfterMinutes: 60,
  stockQuantity: 24,
  lowStockThreshold: 5,
  status: 'active',
  isLowStock: false,
  createdAt: '2026-10-01T07:00:00.000Z',
  updatedAt: '2026-10-01T07:00:00.000Z',
};

const examplePrescriptionInput = {
  patientId: examplePatient.id,
  drugName: 'אקמול',
  dosage: '500 מ"ג',
  form: 'tablet',
  unitsPerDose: 1,
  schedule: { days: [0, 1, 2, 3, 4, 5, 6], times: ['08:00', '20:00'] },
  startDate: '2026-10-01',
  endDate: null,
  instructions: 'אחרי האוכל',
  missedAfterMinutes: 60,
  stockQuantity: 30,
  lowStockThreshold: 5,
  status: 'active',
};

const exampleDose = {
  prescriptionId: examplePrescription.id,
  drugName: 'אקמול',
  dosage: '500 מ"ג',
  form: 'tablet',
  unitsPerDose: 1,
  scheduledAt: '2026-10-21T08:00:00+03:00',
  status: 'taken',
  takenAt: '2026-10-21T08:12:00+03:00',
  intakeId: '6f1c2a3b-4444-4a5b-9c0d-000000000004',
  isLowStock: false,
};

// ===== המסמך =====
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'MedTake API',
    version: '1.0.0',
    description: [
      'שרת למעקב נטילת תרופות. שני תפקידים: **מטפל** (caregiver) ו**מטופל** (patient).',
      '',
      '**איך בודקים מכאן:**',
      '1. `POST /api/auth/login` עם משתמש הדגמה (למשל `rachel@medtake.dev` / `Medtake123`).',
      '2. מעתיקים את ה-`token` מהתשובה.',
      '3. לוחצים על **Authorize** למעלה ומדביקים את ה-Token (בלי המילה Bearer).',
      '4. עכשיו אפשר לקרוא ל-Endpoints המוגנים.',
      '',
      'כל השגיאות חוזרות בפורמט `ApiError`. תאריכים: `YYYY-MM-DD`. זמנים: ISO עם היסט שעון ישראל.',
    ].join('\n'),
  },
  servers: [{ url: '/', description: 'השרת הנוכחי' }],
  tags: [
    { name: 'Health', description: 'בדיקת תקינות' },
    { name: 'Auth', description: 'הרשמה, התחברות ופרטי המשתמש המחובר' },
    { name: 'Patients', description: 'ניהול מטופלים – מטפל בלבד' },
    { name: 'Prescriptions', description: 'מרשמים – צפייה לשניהם, שינויים למטפל בלבד' },
    { name: 'Doses', description: 'מנות מחושבות לפי לוח הזמנים (תצוגה יומית ושבועית)' },
    { name: 'Intakes', description: 'סימון "נלקח" וביטולו – מטופל בלבד' },
    { name: 'Alerts', description: 'התראות מלאי נמוך' },
    { name: 'Messages', description: 'הודעות מהמטופל למטפל שלו' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ApiError: {
        type: 'object',
        required: ['message', 'statusCode'],
        properties: {
          message: { type: 'string' },
          statusCode: { type: 'integer' },
          errors: {
            type: 'object',
            additionalProperties: { type: 'string' },
            description: 'שגיאות ולידציה לפי שם שדה',
          },
        },
        example: {
          message: 'הנתונים שנשלחו אינם תקינים',
          statusCode: 400,
          errors: { email: 'כתובת מייל לא תקינה' },
        },
      },
      UserRole: { type: 'string', enum: ['caregiver', 'patient'] },
      User: {
        type: 'object',
        required: ['id', 'fullName', 'email', 'role', 'caregiverId', 'birthDate', 'createdAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: ref('UserRole'),
          caregiverId: { type: 'string', format: 'uuid', nullable: true, description: 'רק אצל מטופל' },
          birthDate: { type: 'string', format: 'date', nullable: true, description: 'רק אצל מטופל' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        example: examplePatient,
      },
      AuthResponse: {
        type: 'object',
        required: ['token', 'user'],
        properties: { token: { type: 'string', description: 'JWT' }, user: ref('User') },
      },
      RegisterRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password'],
        properties: {
          fullName: { type: 'string', minLength: 2, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, description: 'לפחות 8 תווים, אות אחת וספרה אחת' },
          role: { type: 'string', description: 'לא חובה – מתעלמים ממנו. כל נרשם הוא מטפל' },
        },
        example: { fullName: 'רחל כהן', email: 'new.caregiver@example.com', password: 'Secret123' },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
        example: { email: 'rachel@medtake.dev', password: 'Medtake123' },
      },
      PatientSummary: {
        allOf: [
          ref('User'),
          {
            type: 'object',
            required: ['age', 'activePrescriptions', 'todayTotal', 'todayTaken', 'todayMissed', 'hasLowStock'],
            properties: {
              age: { type: 'integer', nullable: true },
              activePrescriptions: { type: 'integer' },
              todayTotal: { type: 'integer', description: 'כמה מנות יש היום' },
              todayTaken: { type: 'integer', description: 'כמה נלקחו היום' },
              todayMissed: { type: 'integer', description: 'כמה פוספסו היום' },
              hasLowStock: { type: 'boolean', description: 'האם יש מרשם פעיל במלאי נמוך' },
            },
          },
        ],
        example: {
          ...examplePatient,
          age: 82,
          activePrescriptions: 3,
          todayTotal: 5,
          todayTaken: 2,
          todayMissed: 1,
          hasLowStock: true,
        },
      },
      CreatePatientRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password', 'birthDate'],
        properties: {
          fullName: { type: 'string', minLength: 2, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          birthDate: { type: 'string', format: 'date' },
        },
        example: { fullName: 'יוסף לוי', email: 'yosef@example.com', password: 'Patient123', birthDate: '1950-03-02' },
      },
      UpdatePatientRequest: {
        type: 'object',
        required: ['fullName', 'email', 'birthDate'],
        properties: {
          fullName: { type: 'string', minLength: 2, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          birthDate: { type: 'string', format: 'date' },
          password: { type: 'string', description: 'ריק או חסר = הסיסמה לא משתנה' },
        },
        example: { fullName: 'יוסף לוי', email: 'yosef@example.com', birthDate: '1950-03-02', password: '' },
      },
      PrescriptionForm: {
        type: 'string',
        enum: ['tablet', 'capsule', 'syrup', 'drops', 'injection', 'cream', 'other'],
      },
      PrescriptionStatus: { type: 'string', enum: ['active', 'paused', 'finished'] },
      Schedule: {
        type: 'object',
        required: ['days', 'times'],
        properties: {
          days: {
            type: 'array',
            minItems: 1,
            items: { type: 'integer', minimum: 0, maximum: 6 },
            description: '0 = ראשון ... 6 = שבת',
          },
          times: {
            type: 'array',
            minItems: 1,
            maxItems: 12,
            items: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
            description: 'שעות בפורמט HH:mm',
          },
        },
      },
      Prescription: {
        type: 'object',
        required: Object.keys(examplePrescription),
        properties: {
          id: { type: 'string', format: 'uuid' },
          patientId: { type: 'string', format: 'uuid' },
          createdBy: { type: 'string', format: 'uuid', description: 'המטפל שיצר' },
          drugName: { type: 'string' },
          dosage: { type: 'string' },
          form: ref('PrescriptionForm'),
          unitsPerDose: { type: 'integer' },
          schedule: ref('Schedule'),
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date', nullable: true },
          instructions: { type: 'string' },
          missedAfterMinutes: { type: 'integer' },
          stockQuantity: { type: 'integer' },
          lowStockThreshold: { type: 'integer' },
          status: ref('PrescriptionStatus'),
          isLowStock: { type: 'boolean', description: 'מחושב: stockQuantity <= lowStockThreshold' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        example: examplePrescription,
      },
      PrescriptionInput: {
        type: 'object',
        required: ['patientId', 'drugName', 'dosage', 'form', 'unitsPerDose', 'schedule', 'startDate', 'stockQuantity', 'lowStockThreshold'],
        properties: {
          patientId: { type: 'string', format: 'uuid', description: 'ביצירה בלבד. בעריכה מתעלמים ממנו' },
          drugName: { type: 'string', maxLength: 100 },
          dosage: { type: 'string', maxLength: 50 },
          form: ref('PrescriptionForm'),
          unitsPerDose: { type: 'integer', minimum: 1, maximum: 100 },
          schedule: ref('Schedule'),
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date', nullable: true, description: 'לא לפני startDate' },
          instructions: { type: 'string', maxLength: 500, default: '' },
          missedAfterMinutes: { type: 'integer', minimum: 5, maximum: 720, default: 60 },
          stockQuantity: { type: 'integer', minimum: 0 },
          lowStockThreshold: { type: 'integer', minimum: 0 },
          status: { allOf: [ref('PrescriptionStatus')], default: 'active' },
        },
        example: examplePrescriptionInput,
      },
      StatusRequest: {
        type: 'object',
        required: ['status'],
        properties: { status: ref('PrescriptionStatus') },
        example: { status: 'paused' },
      },
      RefillRequest: {
        type: 'object',
        required: ['quantity'],
        properties: { quantity: { type: 'integer', minimum: 1, maximum: 10000 } },
        example: { quantity: 30 },
      },
      DoseStatus: { type: 'string', enum: ['pending', 'taken', 'missed'] },
      Dose: {
        type: 'object',
        required: Object.keys(exampleDose),
        properties: {
          prescriptionId: { type: 'string', format: 'uuid' },
          drugName: { type: 'string' },
          dosage: { type: 'string' },
          form: ref('PrescriptionForm'),
          unitsPerDose: { type: 'integer' },
          scheduledAt: { type: 'string', format: 'date-time' },
          status: ref('DoseStatus'),
          takenAt: { type: 'string', format: 'date-time', nullable: true },
          intakeId: { type: 'string', format: 'uuid', nullable: true, description: 'קיים רק אם סומן – לביטול' },
          isLowStock: { type: 'boolean' },
        },
        example: exampleDose,
      },
      DaySummary: {
        type: 'object',
        required: ['date', 'total', 'taken', 'missed', 'pending'],
        properties: {
          date: { type: 'string', format: 'date' },
          total: { type: 'integer' },
          taken: { type: 'integer' },
          missed: { type: 'integer' },
          pending: { type: 'integer' },
        },
        example: { date: '2026-10-21', total: 4, taken: 3, missed: 1, pending: 0 },
      },
      MarkIntakeRequest: {
        type: 'object',
        required: ['prescriptionId', 'scheduledAt'],
        properties: {
          prescriptionId: { type: 'string', format: 'uuid' },
          scheduledAt: { type: 'string', format: 'date-time', description: 'בדיוק כמו scheduledAt של המנה' },
          note: { type: 'string', maxLength: 200 },
        },
        example: { prescriptionId: examplePrescription.id, scheduledAt: '2026-10-21T08:00:00+03:00' },
      },
      IntakeLog: {
        type: 'object',
        required: ['id', 'prescriptionId', 'patientId', 'scheduledAt', 'takenAt', 'note'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          prescriptionId: { type: 'string', format: 'uuid' },
          patientId: { type: 'string', format: 'uuid' },
          scheduledAt: { type: 'string', format: 'date-time' },
          takenAt: { type: 'string', format: 'date-time' },
          note: { type: 'string', nullable: true },
        },
        example: {
          id: exampleDose.intakeId,
          prescriptionId: examplePrescription.id,
          patientId: examplePatient.id,
          scheduledAt: '2026-10-21T08:00:00+03:00',
          takenAt: '2026-10-21T08:12:00+03:00',
          note: null,
        },
      },
      LowStockAlert: {
        type: 'object',
        required: ['prescriptionId', 'drugName', 'patientId', 'patientName', 'stockQuantity', 'lowStockThreshold'],
        properties: {
          prescriptionId: { type: 'string', format: 'uuid' },
          drugName: { type: 'string' },
          patientId: { type: 'string', format: 'uuid' },
          patientName: { type: 'string' },
          stockQuantity: { type: 'integer' },
          lowStockThreshold: { type: 'integer' },
        },
        example: {
          prescriptionId: examplePrescription.id,
          drugName: 'אקמול',
          patientId: examplePatient.id,
          patientName: 'אברהם כהן',
          stockQuantity: 2,
          lowStockThreshold: 5,
        },
      },
      SendMessageRequest: {
        type: 'object',
        required: ['text'],
        properties: { text: { type: 'string', minLength: 1, maxLength: 500 } },
        example: { text: 'האקמול כמעט נגמר' },
      },
      Message: {
        type: 'object',
        required: ['id', 'patientId', 'patientName', 'text', 'createdAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          patientId: { type: 'string', format: 'uuid' },
          patientName: { type: 'string' },
          text: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        example: {
          id: '6f1c2a3b-5555-4a5b-9c0d-000000000005',
          patientId: examplePatient.id,
          patientName: 'אברהם כהן',
          text: 'האקמול כמעט נגמר',
          createdAt: '2026-10-21T10:15:00+03:00',
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'בדיקת תקינות השרת והמסד',
        responses: {
          200: ok('השרת והמסד תקינים', { type: 'object' }, { status: 'ok', database: 'ok', time: '2026-10-21T08:00:00.000Z' }),
          503: ok('המסד לא זמין', { type: 'object' }, { status: 'error', database: 'unavailable', time: '2026-10-21T08:00:00.000Z' }),
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'הרשמה – יוצר מטפל חדש ומחזיר Token',
        requestBody: { required: true, content: json(ref('RegisterRequest')) },
        responses: {
          201: ok('נרשם בהצלחה', ref('AuthResponse'), { token: 'eyJhbGciOi...', user: exampleCaregiver }),
          ...errors(400, 409),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'התחברות – מחזיר Token ופרטי משתמש',
        requestBody: { required: true, content: json(ref('LoginRequest')) },
        responses: {
          200: ok('התחברות הצליחה', ref('AuthResponse'), { token: 'eyJhbGciOi...', user: exampleCaregiver }),
          400: errors(400)[400],
          401: {
            description: 'מייל או סיסמה שגויים',
            content: json(ref('ApiError'), { message: 'מייל או סיסמה שגויים', statusCode: 401 }),
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'פרטי המשתמש המחובר (לפי ה-Token)',
        security: bearer,
        responses: { 200: ok('המשתמש המחובר', ref('User'), exampleCaregiver), ...errors(401) },
      },
    },
    '/api/patients': {
      get: {
        tags: ['Patients'],
        summary: 'רשימת המטופלים שלי, עם סיכום של היום',
        description: 'מטפל בלבד. מחזיר רק מטופלים של המטפל המחובר.',
        security: bearer,
        parameters: [
          queryParam('search', 'חיפוש לפי שם', { type: 'string' }),
          queryParam('sortBy', 'שדה מיון', { type: 'string', enum: ['fullName', 'createdAt'], default: 'fullName' }),
          queryParam('sortOrder', 'כיוון מיון', { type: 'string', enum: ['asc', 'desc'], default: 'asc' }),
          queryParam('lowStock', 'רק מטופלים עם מלאי נמוך', { type: 'string', enum: ['true', 'false'] }),
          queryParam('missedToday', 'רק מטופלים שפספסו מנה היום', { type: 'string', enum: ['true', 'false'] }),
        ],
        responses: {
          200: ok('רשימת מטופלים', { type: 'array', items: ref('PatientSummary') }),
          ...errors(400, 401, 403),
        },
      },
      post: {
        tags: ['Patients'],
        summary: 'יצירת מטופל חדש (המטפל יוצר לו חשבון)',
        security: bearer,
        requestBody: { required: true, content: json(ref('CreatePatientRequest')) },
        responses: { 201: ok('המטופל נוצר', ref('User'), examplePatient), ...errors(400, 401, 403, 409) },
      },
    },
    '/api/patients/{id}': {
      parameters: [idParam('מזהה המטופל')],
      get: {
        tags: ['Patients'],
        summary: 'מטופל אחד עם סיכום של היום',
        security: bearer,
        responses: { 200: ok('המטופל', ref('PatientSummary')), ...errors(400, 401, 403, 404) },
      },
      put: {
        tags: ['Patients'],
        summary: 'עריכת מטופל',
        security: bearer,
        requestBody: { required: true, content: json(ref('UpdatePatientRequest')) },
        responses: { 200: ok('המטופל עודכן', ref('User'), examplePatient), ...errors(400, 401, 403, 404, 409) },
      },
      delete: {
        tags: ['Patients'],
        summary: 'מחיקת מטופל (כולל כל המרשמים וההיסטוריה שלו)',
        security: bearer,
        responses: { 204: { description: 'נמחק' }, ...errors(400, 401, 403, 404) },
      },
    },
    '/api/prescriptions': {
      get: {
        tags: ['Prescriptions'],
        summary: 'רשימת מרשמים עם חיפוש, סינון ומיון',
        description: 'מטפל: חובה patientId של מטופל שלו. מטופל: תמיד המרשמים שלו (patientId לא נדרש).',
        security: bearer,
        parameters: [
          queryParam('patientId', 'חובה למטפל', { type: 'string', format: 'uuid' }),
          queryParam('search', 'חיפוש לפי שם תרופה', { type: 'string' }),
          queryParam('status', 'סינון לפי סטטוס', ref('PrescriptionStatus')),
          queryParam('form', 'סינון לפי צורה', ref('PrescriptionForm')),
          queryParam('sortBy', 'שדה מיון', { type: 'string', enum: ['drugName', 'startDate', 'stockQuantity'], default: 'drugName' }),
          queryParam('sortOrder', 'כיוון מיון', { type: 'string', enum: ['asc', 'desc'], default: 'asc' }),
        ],
        responses: {
          200: ok('רשימת מרשמים', { type: 'array', items: ref('Prescription') }),
          ...errors(400, 401, 404),
        },
      },
      post: {
        tags: ['Prescriptions'],
        summary: 'יצירת מרשם (מטפל בלבד)',
        security: bearer,
        requestBody: { required: true, content: json(ref('PrescriptionInput')) },
        responses: { 201: ok('המרשם נוצר', ref('Prescription'), examplePrescription), ...errors(400, 401, 403, 404) },
      },
    },
    '/api/prescriptions/{id}': {
      parameters: [idParam('מזהה המרשם')],
      get: {
        tags: ['Prescriptions'],
        summary: 'מרשם אחד',
        security: bearer,
        responses: { 200: ok('המרשם', ref('Prescription'), examplePrescription), ...errors(400, 401, 404) },
      },
      put: {
        tags: ['Prescriptions'],
        summary: 'עריכת מרשם (מטפל בלבד)',
        security: bearer,
        requestBody: { required: true, content: json(ref('PrescriptionInput')) },
        responses: { 200: ok('המרשם עודכן', ref('Prescription'), examplePrescription), ...errors(400, 401, 403, 404) },
      },
      delete: {
        tags: ['Prescriptions'],
        summary: 'מחיקת מרשם שנוצר בטעות (מטפל בלבד). לסיום מרשם – לשנות סטטוס',
        security: bearer,
        responses: { 204: { description: 'נמחק' }, ...errors(400, 401, 403, 404) },
      },
    },
    '/api/prescriptions/{id}/status': {
      parameters: [idParam('מזהה המרשם')],
      patch: {
        tags: ['Prescriptions'],
        summary: 'שינוי סטטוס: פעיל / מושהה / הסתיים (מטפל בלבד)',
        security: bearer,
        requestBody: { required: true, content: json(ref('StatusRequest')) },
        responses: { 200: ok('הסטטוס עודכן', ref('Prescription')), ...errors(400, 401, 403, 404) },
      },
    },
    '/api/prescriptions/{id}/refill': {
      parameters: [idParam('מזהה המרשם')],
      post: {
        tags: ['Prescriptions'],
        summary: 'חידוש מלאי – מוסיף כמות למלאי הקיים (מטפל בלבד)',
        security: bearer,
        requestBody: { required: true, content: json(ref('RefillRequest')) },
        responses: { 200: ok('המלאי עודכן', ref('Prescription')), ...errors(400, 401, 403, 404) },
      },
    },
    '/api/doses': {
      get: {
        tags: ['Doses'],
        summary: 'מנות מחושבות בטווח תאריכים (תצוגה יומית)',
        description: 'ממוינות לפי שעה. pending = ממתין, taken = נלקח, missed = פוספס. עד 31 ימים.',
        security: bearer,
        parameters: [
          queryParam('from', 'מתאריך (כולל)', { type: 'string', format: 'date' }, true),
          queryParam('to', 'עד תאריך (כולל)', { type: 'string', format: 'date' }, true),
          queryParam('patientId', 'חובה למטפל', { type: 'string', format: 'uuid' }),
          queryParam('status', 'סינון לפי סטטוס', ref('DoseStatus')),
        ],
        responses: {
          200: ok('רשימת מנות', { type: 'array', items: ref('Dose') }, [exampleDose]),
          ...errors(400, 401, 404),
        },
      },
    },
    '/api/doses/summary': {
      get: {
        tags: ['Doses'],
        summary: 'סיכום לכל יום בטווח (תצוגה שבועית)',
        security: bearer,
        parameters: [
          queryParam('from', 'מתאריך (כולל)', { type: 'string', format: 'date' }, true),
          queryParam('to', 'עד תאריך (כולל)', { type: 'string', format: 'date' }, true),
          queryParam('patientId', 'חובה למטפל', { type: 'string', format: 'uuid' }),
        ],
        responses: {
          200: ok('סיכום ימים', { type: 'array', items: ref('DaySummary') }),
          ...errors(400, 401, 404),
        },
      },
    },
    '/api/intakes': {
      post: {
        tags: ['Intakes'],
        summary: 'סימון מנה כ"נלקחה" (מטופל בלבד)',
        description: 'מוריד unitsPerDose מהמלאי (לא מתחת ל-0). מותר לסמן גם מנה שעברה או עתידית.',
        security: bearer,
        requestBody: { required: true, content: json(ref('MarkIntakeRequest')) },
        responses: {
          201: ok('סומן', ref('IntakeLog')),
          ...errors(400, 401, 403, 404),
          409: {
            description: 'המנה כבר סומנה',
            content: json(ref('ApiError'), { message: 'המנה הזו כבר סומנה כנלקחה', statusCode: 409 }),
          },
        },
      },
    },
    '/api/intakes/{id}': {
      parameters: [idParam('intakeId מתוך ה-Dose')],
      delete: {
        tags: ['Intakes'],
        summary: 'ביטול סימון "נלקח" – המלאי חוזר (מטופל בלבד)',
        security: bearer,
        responses: { 204: { description: 'בוטל' }, ...errors(400, 401, 403, 404) },
      },
    },
    '/api/alerts/low-stock': {
      get: {
        tags: ['Alerts'],
        summary: 'מרשמים פעילים במלאי נמוך',
        description: 'מטפל: של כל המטופלים שלו. מטופל: רק שלו.',
        security: bearer,
        responses: {
          200: ok('רשימת התראות', { type: 'array', items: ref('LowStockAlert') }),
          ...errors(401),
        },
      },
    },
    '/api/messages': {
      get: {
        tags: ['Messages'],
        summary: 'רשימת הודעות (50 האחרונות, החדשות קודם)',
        description: 'מטפל: מכל המטופלים שלו, או ממטופל אחד עם patientId. מטופל: ההודעות ששלח.',
        security: bearer,
        parameters: [queryParam('patientId', 'מטפל בלבד – סינון למטופל אחד', { type: 'string', format: 'uuid' })],
        responses: {
          200: ok('רשימת הודעות', { type: 'array', items: ref('Message') }),
          ...errors(400, 401, 404),
        },
      },
      post: {
        tags: ['Messages'],
        summary: 'שליחת הודעה למטפל (מטופל בלבד)',
        description: 'המטפל נקבע לפי המטופל המחובר – לא נשלח בגוף הבקשה.',
        security: bearer,
        requestBody: { required: true, content: json(ref('SendMessageRequest')) },
        responses: {
          201: ok('נשלחה', ref('Message')),
          ...errors(400, 401, 403),
        },
      },
    },
    '/api/messages/{id}': {
      parameters: [idParam('מזהה ההודעה')],
      delete: {
        tags: ['Messages'],
        summary: 'מחיקת הודעה שהתקבלה (מטפל בלבד)',
        security: bearer,
        responses: {
          204: { description: 'נמחקה' },
          ...errors(401, 403, 404),
        },
      },
    },
  },
};
