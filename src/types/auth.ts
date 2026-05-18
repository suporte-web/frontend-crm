export type UserRole =
  | 'ADMIN'
  | 'GESTAO'
  | 'COMERCIAL'
  | 'MARKETING'
  | 'CLIENTE';

export interface RoleScreenPermission {
  id: string;
  role: UserRole;
  screenKey: string;
  screenLabel?: string | null;
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword?: boolean;
  clientProfile?: unknown | null;
  screenPermissions?: RoleScreenPermission[];
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}
