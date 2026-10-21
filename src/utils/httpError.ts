/** שגיאה עם קוד HTTP – נזרקת מה-Services ונתפסת ב-errorHandler */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string, errors?: Record<string, string>) =>
  new HttpError(400, message, errors);
export const unauthorized = (message = 'יש להתחבר למערכת') => new HttpError(401, message);
export const forbidden = (message = 'אין לך הרשאה לבצע פעולה זו') => new HttpError(403, message);
export const notFound = (message = 'המשאב המבוקש לא נמצא') => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);
