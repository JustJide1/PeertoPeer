import { httpClient, type ApiEnvelope } from './httpClient';

export type UserRole = 'STUDENT' | 'LECTURER';
export type UserLevel = 'L100' | 'L200' | 'L300' | 'L400';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  level: UserLevel | null;
  createdAt: string;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  level: number;
}

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const { data } = await httpClient.post<ApiEnvelope<AuthResult>>('/auth/login', payload);
  return data.data;
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  const { data } = await httpClient.post<ApiEnvelope<AuthResult>>('/auth/register', payload);
  return data.data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await httpClient.get<ApiEnvelope<AuthUser>>('/auth/me');
  return data.data;
}

export async function refreshSession(): Promise<void> {
  await httpClient.post('/auth/refresh');
}

export async function logout(): Promise<void> {
  await httpClient.post('/auth/logout');
}
