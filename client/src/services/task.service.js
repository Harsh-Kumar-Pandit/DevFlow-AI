import api from './api';

export const taskService = {
  create: (data) => api.post('/task/create', data),
  getProjectTasks: (projectId, params) => api.get(`/task/project/${projectId}`, { params }),
  getTask: (taskId) => api.get(`/task/${taskId}`),
  updateTask: (taskId, data) => api.patch(`/task/${taskId}`, data),
  updateTaskStatus: (taskId, status) => api.patch(`/task/${taskId}/status`, { status }),
  deleteTask: (taskId) => api.delete(`/task/${taskId}`),
  addAttachment: (taskId, data) => api.post(`/task/${taskId}/attachment`, data),
  deleteAttachment: (taskId, publicId) => api.delete(`/task/${taskId}/attachment/${publicId}`),
};
