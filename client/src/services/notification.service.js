import api from './api';

export const notificationService = {
  getAll: () => api.get('/notification'),
  markAsRead: (id) => api.patch(`/notification/${id}/read`),
  markAllAsRead: () => api.patch('/notification/read-all'),
  delete: (id) => api.delete(`/notification/${id}`),
};
