import { Level, Role } from '@prisma/client';
import type { CookieOptions, Request, Response } from 'express';
import { Router } from 'express';
import { body } from 'express-validator';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/authenticate';
import { HttpError } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type AccessTokenPayload,
} from '../utils/jwt';
import { comparePassword, hashPassword, PASSWORD_PATTERN } from '../utils/password';
import { hashToken } from '../utils/tokenHash';

export const authRouter = Router();

const BOWEN_EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@bowen\.edu\.ng$/;
const ALLOWED_LEVELS = [100, 200, 300, 400] as const;

const emailValidator = body('email')
  .trim()
  .notEmpty()
  .withMessage('Email is required')
  .bail()
  .matches(BOWEN_EMAIL_PATTERN)
  .withMessage('Email must be a valid @bowen.edu.ng address')
  .normalizeEmail();

const passwordValidator = (field = 'password') =>
  body(field)
    .notEmpty()
    .withMessage('Password is required')
    .bail()
    .matches(PASSWORD_PATTERN)
    .withMessage('Password must be at least 8 characters and include an uppercase letter and a number');

const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  emailValidator,
  passwordValidator(),
  body('level')
    .notEmpty()
    .withMessage('Level is required')
    .bail()
    .custom((value) => ALLOWED_LEVELS.includes(Number(value) as (typeof ALLOWED_LEVELS)[number]))
    .withMessage('Level must be one of 100, 200, 300, 400'),
  body('role')
    .optional()
    .isIn(Object.values(Role))
    .withMessage('Role must be STUDENT or LECTURER'),
];

const loginValidators = [
  body('email').trim().notEmpty().withMessage('Email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('rememberMe').optional().isBoolean().withMessage('rememberMe must be a boolean'),
];

const refreshValidators = [
  body('refreshToken').optional().isString().withMessage('refreshToken must be a string'),
];

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function baseCookieOptions(): CookieOptions {
  const isProduction = env.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
}

function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  rememberMe: boolean,
): void {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOptions(),
    maxAge: FIFTEEN_MINUTES_MS,
  });

  // When "remember me" is unchecked, omit maxAge so the refresh cookie is a
  // session cookie that the browser discards when it closes.
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions(),
    ...(rememberMe ? { maxAge: SEVEN_DAYS_MS } : {}),
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions());
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseCookieOptions());
}

interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  level: Level | null;
  createdAt: Date;
}

function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  level: Level | null;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    level: user.level,
    createdAt: user.createdAt,
  };
}

function levelToEnum(level: number): Level {
  return `L${level}` as Level;
}

async function issueAndPersistTokens(user: { id: string; email: string; role: Role }) {
  const payload: AccessTokenPayload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user.id });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: hashToken(refreshToken) },
  });

  return { accessToken, refreshToken };
}

function ok<T>(res: Response, status: number, data: T, message: string): void {
  res.status(status).json({ success: true, data, message });
}

// POST /api/auth/register
authRouter.post(
  '/register',
  validate(registerValidators),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, level, role } = req.body as {
      name: string;
      email: string;
      password: string;
      level: number | string;
      role?: Role;
    };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpError(409, 'A user with this email already exists');
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role: role ?? Role.STUDENT,
        level: levelToEnum(Number(level)),
      },
    });

    const tokens = await issueAndPersistTokens(user);
    setAuthCookies(res, tokens, false);

    ok(res, 201, { user: toSafeUser(user), ...tokens }, 'Registration successful');
  }),
);

// POST /api/auth/login
authRouter.post(
  '/login',
  validate(loginValidators),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, rememberMe } = req.body as {
      email: string;
      password: string;
      rememberMe?: boolean;
    };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const tokens = await issueAndPersistTokens(user);
    setAuthCookies(res, tokens, Boolean(rememberMe));

    ok(res, 200, { user: toSafeUser(user), ...tokens }, 'Login successful');
  }),
);

// POST /api/auth/refresh
authRouter.post(
  '/refresh',
  validate(refreshValidators),
  asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = (req.body as { refreshToken?: string }).refreshToken ?? req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new HttpError(401, 'Refresh token is required');
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new HttpError(401, 'Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.refreshTokenHash !== hashToken(refreshToken)) {
      throw new HttpError(401, 'Invalid or expired refresh token');
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...baseCookieOptions(),
      maxAge: FIFTEEN_MINUTES_MS,
    });

    ok(res, 200, { accessToken }, 'Access token refreshed');
  }),
);

// POST /api/auth/logout
authRouter.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.user.update({
      where: { id: req.user!.sub },
      data: { refreshTokenHash: null },
    });

    clearAuthCookies(res);

    ok(res, 200, null, 'Logged out successfully');
  }),
);

// GET /api/auth/me
authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    ok(res, 200, toSafeUser(user), 'Current user profile');
  }),
);
