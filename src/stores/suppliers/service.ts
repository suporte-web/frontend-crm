import { Api } from '@/utils/Api';
import type { CreateSupplierInvitePayload, SupplierInvite, } from '@/types/suppliers';
export async function getSupplierInvites(token: string) {
  const { data } = await Api.get<SupplierInvite[]>('/suppliers/invites', { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function createSupplierInvite(payload: CreateSupplierInvitePayload, token: string) {
  const { data } = await Api.post<SupplierInvite>('/suppliers/invites', payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
