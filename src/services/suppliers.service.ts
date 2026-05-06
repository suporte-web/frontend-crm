import { apiFetch } from '@/services/api';
import type {
  CreateSupplierInvitePayload,
  SupplierInvite,
} from '@/types/suppliers';

export function getSupplierInvites(token: string) {
  return apiFetch<SupplierInvite[]>('/suppliers/invites', {}, token);
}

export function createSupplierInvite(
  payload: CreateSupplierInvitePayload,
  token: string,
) {
  return apiFetch<SupplierInvite>(
    '/suppliers/invites',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}
