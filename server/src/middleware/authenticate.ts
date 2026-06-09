import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './errorHandler';
import { verifyAccessToken, type AccessTokenPayload } from '../utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  const token = bearerToken ?? (req.cookies?.accessToken as string | undefined);

  if (!token) {
    next(new HttpError(401, 'Authentication required'));
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired access token'));
  }
}

export function authorize(...roles: AccessTokenPayload['role'][]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(401, 'Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new HttpError(403, 'You do not have permission to perform this action'));
      return;
    }

    next();
  };
}
