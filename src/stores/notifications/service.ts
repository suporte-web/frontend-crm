import { Api } from '@/utils/Api';
import type { CrmNotification, NotificationCount } from '@/types/notifications';
export async function getNotifications(token: string) {
  const { data } = await Api.get<CrmNotification[]>('/notifications', { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function getUnreadNotificationCount(token: string) {
  const { data } = await Api.get<NotificationCount>('/notifications/unread-count', { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function markNotificationRead(id: string, token: string) {
  const { data } = await Api.patch<CrmNotification>(`/notifications/${id}/read`, {}, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function markAllNotificationsRead(token: string) {
  const { data } = await Api.patch<NotificationCount>('/notifications/read-all', {}, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
