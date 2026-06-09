import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

const ACCESS_TOKEN_OPTIONS: SignOptions = { expiresIn: '15m' };
const REFRESH_TOKEN_OPTIONS: SignOptions = { expiresIn: '7d' };

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: 'STUDENT' | 'LECTURER';
}

export type RefreshTokenPayload = Pick<AccessTokenPayload, 'sub'>;

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, ACCESS_TOKEN_OPTIONS);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, REFRESH_TOKEN_OPTIONS);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as RefreshTokenPayload;
}
