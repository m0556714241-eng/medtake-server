import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError';

interface ErrorBody {
  message: string;
  statusCode: number;
  errors?: Record<string, string>;
}

const send = (res: Response, body: ErrorBody) => res.status(body.statusCode).json(body);

/** הופך שגיאות Zod לאובייקט { שם שדה: הודעה } */
export const zodErrorsToMap = (error: ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
};

export const notFoundHandler = (req: Request, res: Response) => {
  send(res, { statusCode: 404, message: `הנתיב ${req.method} ${req.originalUrl} לא קיים` });
};

/** טיפול מרכזי בשגיאות – כל שגיאה מוחזרת באותו פורמט */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return send(res, { statusCode: err.statusCode, message: err.message, errors: err.errors });
  }

  if (err instanceof ZodError) {
    return send(res, { statusCode: 400, message: 'הנתונים שנשלחו אינם תקינים', errors: zodErrorsToMap(err) });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return send(res, { statusCode: 409, message: 'הרשומה כבר קיימת' });
    }
    if (err.code === 'P2025') {
      return send(res, { statusCode: 404, message: 'המשאב המבוקש לא נמצא' });
    }
  }

  // JSON לא תקין בגוף הבקשה
  if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed') {
    return send(res, { statusCode: 400, message: 'גוף הבקשה אינו JSON תקין' });
  }

  console.error(err);
  return send(res, { statusCode: 500, message: 'שגיאת שרת פנימית' });
};
