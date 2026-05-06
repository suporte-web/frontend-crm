export type UserRole =
  | 'ADMIN'
  | 'GESTAO'
  | 'COMERCIAL'
  | 'MARKETING'
  | 'CLIENTE';

export interface ClientProfile {
  id: string;
  document?: string | null;
  phone?: string | null;
  companyName?: string | null;
  segment?: string | null;
  status?: string | null;
  internalOwnerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  clientProfile?: ClientProfile | null;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
  document?: string;
  phone?: string;
  companyName?: string;
  segment?: string;
  status?: string;
  internalOwnerId?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  document?: string;
  phone?: string;
  companyName?: string;
  segment?: string;
  status?: string;
  internalOwnerId?: string;
}
