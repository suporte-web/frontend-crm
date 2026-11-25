import { Api } from '@/utils/Api';
import type { CreateSupplierInvitePayload, SupplierInvite, } from '@/types/suppliers';

export const SuppliersService = {
  getSupplierInvites: async () => {
    const { data } = await Api.get<SupplierInvite[]>('/suppliers/invites');
    return data;
  },

  createSupplierInvite: async (payload: CreateSupplierInvitePayload) => {
    const { data } = await Api.post<SupplierInvite>('/suppliers/invites', payload);
    return data;
  },
};
