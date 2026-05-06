export type UserRole =
  | 'ADMIN'
  | 'GESTAO'
  | 'COMERCIAL'
  | 'MARKETING'
  | 'CLIENTE';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword?: boolean;
  clientProfile?: unknown | null;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}
