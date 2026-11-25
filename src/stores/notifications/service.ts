import { Api } from '@/utils/Api';
import type { CrmNotification, NotificationCount } from '@/types/notifications';

export const NotificationsService = {
  getNotifications: async () => {
    const { data } = await Api.get<CrmNotification[]>('/notifications');
    return data;
  },

  getUnreadNotificationCount: async () => {
    const { data } = await Api.get<NotificationCount>('/notifications/unread-count');
    return data;
  },

  markNotificationRead: async (id: string) => {
    const { data } = await Api.patch<CrmNotification>(`/notifications/${id}/read`, {});
    return data;
  },

  markAllNotificationsRead: async () => {
    const { data } = await Api.patch<NotificationCount>('/notifications/read-all', {});
    return data;
  },
};
