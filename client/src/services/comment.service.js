import api from './api';

export const commentService = {
  add: (taskId, message) => api.post('/comment/add', { taskId, message }),
  getTaskComments: (taskId) => api.get(`/comment/task/${taskId}`),
  updateComment: (commentId, message) => api.patch(`/comment/${commentId}`, { message }),
  deleteComment: (commentId) => api.delete(`/comment/${commentId}`),
};
