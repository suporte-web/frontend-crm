import type { TicketStatus, TicketType } from './tickets';

export type CrmNotification = {
  id: string;
  userId: string;
  ticketId?: string | null;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
  ticket?: {
    id: string;
    subject: string;
    status: TicketStatus;
    type: TicketType;
  } | null;
};

export type NotificationCount = {
  count: number;
};
