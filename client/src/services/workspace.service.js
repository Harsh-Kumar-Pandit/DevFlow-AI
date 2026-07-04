import api from './api';

export const workspaceService = {
  create: (data) => api.post('/workspace/create', data),
  getMyWorkspaces: () => api.get('/workspace/my-workspaces'),
  join: (inviteCode) => api.post('/workspace/join', { inviteCode }),
  getJoinRequests: (workspaceId) => api.get(`/workspace/${workspaceId}/requests`),
  acceptJoinRequest: (requestId) => api.patch(`/workspace/request/${requestId}/accept`),
  rejectJoinRequest: (requestId) => api.patch(`/workspace/request/${requestId}/reject`),
  removeMember: (workspaceId, userId) => api.delete(`/workspace/${workspaceId}/member/${userId}`),
  leaveWorkspace: (workspaceId) => api.delete(`/workspace/leave/${workspaceId}`),
  deleteWorkspace: (workspaceId) => api.delete(`/workspace/${workspaceId}`),
};
