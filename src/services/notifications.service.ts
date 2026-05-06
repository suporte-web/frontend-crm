import { apiFetch } from '@/services/api';
import type { CrmNotification, NotificationCount } from '@/types/notifications';

export function getNotifications(token: string) {
  return apiFetch<CrmNotification[]>('/notifications', {}, token);
}

export function getUnreadNotificationCount(token: string) {
  return apiFetch<NotificationCount>('/notifications/unread-count', {}, token);
}

export function markNotificationRead(id: string, token: string) {
  return apiFetch<CrmNotification>(
    `/notifications/${id}/read`,
    {
      method: 'PATCH',
      body: JSON.stringify({}),
    },
    token,
  );
}

export function markAllNotificationsRead(token: string) {
  return apiFetch<NotificationCount>(
    '/notifications/read-all',
    {
      method: 'PATCH',
      body: JSON.stringify({}),
    },
    token,
  );
}
