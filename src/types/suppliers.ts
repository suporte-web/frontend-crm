export type SupplierInviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';

export type SupplierInvite = {
  id: string;
  companyName: string;
  contactName?: string | null;
  email: string;
  phone?: string | null;
  token: string;
  status: SupplierInviteStatus;
  notes?: string | null;
  inviteUrl: string;
  invitedById?: string | null;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  invitedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type CreateSupplierInvitePayload = {
  companyName: string;
  email: string;
  contactName?: string;
  phone?: string;
  notes?: string;
};
