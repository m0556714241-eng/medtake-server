import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';
import { signToken } from '../middleware/auth';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';
import { conflict, notFound, unauthorized } from '../utils/httpError';
import { toPublicUser } from '../utils/serializers';

const SALT_ROUNDS = 10;

export const hashPassword = (password: string) => bcrypt.hash(password, SALT_ROUNDS);

export const register = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict('כתובת המייל כבר רשומה במערכת');

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: 'caregiver',
    },
  });
  return { token: signToken(user.id, user.role), user: toPublicUser(user) };
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const valid = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!user || !valid) throw unauthorized('מייל או סיסמה שגויים');
  return { token: signToken(user.id, user.role), user: toPublicUser(user) };
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('המשתמש לא נמצא');
  return toPublicUser(user);
};
