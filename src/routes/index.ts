import { Router } from 'express';
import * as alerts from '../controllers/alerts.controller';
import * as auth from '../controllers/auth.controller';
import * as doses from '../controllers/doses.controller';
import { health } from '../controllers/health.controller';
import * as intakes from '../controllers/intakes.controller';
import * as patients from '../controllers/patients.controller';
import * as prescriptions from '../controllers/prescriptions.controller';
import { authenticate, requireRole } from '../middleware/auth';

export const apiRouter = Router();

// כל מי שמחובר (Token תקין), ולפי תפקיד
const loggedIn = authenticate;
const caregiverOnly = [authenticate, requireRole('caregiver')];
const patientOnly = [authenticate, requireRole('patient')];

// ציבורי
apiRouter.get('/health', health);
apiRouter.post('/auth/register', auth.register);
apiRouter.post('/auth/login', auth.login);

// מכאן והלאה – חובה Token.
// (מוגדר לכל נתיב בנפרד, כדי שנתיב שלא קיים יחזיר 404 ולא 401)
apiRouter.get('/auth/me', loggedIn, auth.me);

// מטופלים – מטפל בלבד
apiRouter.get('/patients', caregiverOnly, patients.list);
apiRouter.post('/patients', caregiverOnly, patients.create);
apiRouter.get('/patients/:id', caregiverOnly, patients.getOne);
apiRouter.put('/patients/:id', caregiverOnly, patients.update);
apiRouter.delete('/patients/:id', caregiverOnly, patients.remove);

// מרשמים – צפייה לשניהם, שינוי למטפל בלבד
apiRouter.get('/prescriptions', loggedIn, prescriptions.list);
apiRouter.post('/prescriptions', caregiverOnly, prescriptions.create);
apiRouter.get('/prescriptions/:id', loggedIn, prescriptions.getOne);
apiRouter.put('/prescriptions/:id', caregiverOnly, prescriptions.update);
apiRouter.patch('/prescriptions/:id/status', caregiverOnly, prescriptions.changeStatus);
apiRouter.post('/prescriptions/:id/refill', caregiverOnly, prescriptions.refill);
apiRouter.delete('/prescriptions/:id', caregiverOnly, prescriptions.remove);

// מנות – צפייה לשניהם
apiRouter.get('/doses', loggedIn, doses.list);
apiRouter.get('/doses/summary', loggedIn, doses.summary);

// סימון נטילה – מטופל בלבד
apiRouter.post('/intakes', patientOnly, intakes.mark);
apiRouter.delete('/intakes/:id', patientOnly, intakes.unmark);

// התראות
apiRouter.get('/alerts/low-stock', loggedIn, alerts.lowStock);
