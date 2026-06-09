export type UserRole = 'student' | 'mentor' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  matricNumber: string;
  level: 100 | 200 | 300 | 400 | 500;
  role: UserRole;
  bio?: string;
  subjects: string[];
  createdAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthCredentials {
  fullName: string;
  matricNumber: string;
  level: User['level'];
}

export interface AuthResponse {
  user: User;
  token: string;
}
