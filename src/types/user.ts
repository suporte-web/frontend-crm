export type UserRole =
  | 'LIDER_ATENDIMENTO'
  | 'ATENDIMENTO'
  | 'ADMIN'
  | 'GESTAO'
  | 'COMERCIAL'
  | 'OPERACAO'
  | 'MARKETING'
  | 'CLIENTE';

export interface ClientProfile {
  id: string;
  document?: string | null;
  phone?: string | null;
  companyName?: string | null;
  legalName?: string | null;
  tradeName?: string | null;
  cnae?: string | null;
  stateRegistration?: string | null;
  businessActivity?: string | null;
  taxRegime?: string | null;
  address?: string | null;
  bankDetails?: string | null;
  modality?: string | null;
  registrationDate?: string | null;
  segment?: string | null;
  status?: string | null;
  internalOwnerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  contacts?: ClientContactPayload[];
}

export interface ClientContactPayload {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  notes?: string;
  isPrimary?: boolean;
}

export interface RoleScreenPermission {
  id: string;
  role: UserRole;
  screenKey: string;
  screenLabel?: string | null;
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleScreenPermissionsGroup {
  role: UserRole;
  screens: RoleScreenPermission[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles?: UserRole[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  clientProfile?: ClientProfile | null;
  screenPermissions?: RoleScreenPermission[];
}

export interface CreateUserPayload {
  name: string;
  email?: string;
  password?: string;
  role?: UserRole;
  roles?: UserRole[];
  isActive?: boolean;
  document?: string;
  phone?: string;
  companyName?: string;
  legalName?: string;
  tradeName?: string;
  cnae?: string;
  stateRegistration?: string;
  businessActivity?: string;
  taxRegime?: string;
  address?: string;
  bankDetails?: string;
  modality?: string;
  registrationDate?: string;
  segment?: string;
  status?: string;
  internalOwnerId?: string;
  contacts?: ClientContactPayload[];
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: UserRole;
  roles?: UserRole[];
  isActive?: boolean;
  document?: string;
  phone?: string;
  companyName?: string;
  legalName?: string;
  tradeName?: string;
  cnae?: string;
  stateRegistration?: string;
  businessActivity?: string;
  taxRegime?: string;
  address?: string;
  bankDetails?: string;
  modality?: string;
  registrationDate?: string;
  segment?: string;
  status?: string;
  internalOwnerId?: string;
}

export interface UpdateRoleScreenPermissionsPayload {
  screens: Array<{
    screenKey: string;
    screenLabel?: string;
    isEnabled: boolean;
  }>;
}
