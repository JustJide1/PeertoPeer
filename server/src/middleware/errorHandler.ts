import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function fail(res: Response, status: number, message: string): void {
  res.status(status).json({ success: false, data: null, message });
}

export function notFoundHandler(req: Request, res: Response): void {
  fail(res, 404, `Route ${req.method} ${req.originalUrl} not found`);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    fail(res, err.status, err.message);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      fail(res, 409, 'A record with these details already exists');
      return;
    }
    if (err.code === 'P2025') {
      fail(res, 404, 'The requested record was not found');
      return;
    }
  }

  const message = err instanceof Error ? err.message : 'Internal server error';

  if (env.nodeEnv !== 'production') {
    console.error(err);
  }

  fail(res, 500, env.nodeEnv === 'production' ? 'Internal server error' : message);
}
