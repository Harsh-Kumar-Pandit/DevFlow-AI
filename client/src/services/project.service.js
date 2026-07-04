import api from './api';

export const projectService = {
  create: (data) => api.post('/project/create', data),
  getWorkspaceProjects: (workspaceId) => api.get(`/project/workspace/${workspaceId}`),
  getProject: (projectId) => api.get(`/project/${projectId}`),
  getProjectBoard: (projectId) => api.get(`/project/${projectId}/board`),
  updateProject: (projectId, data) => api.patch(`/project/${projectId}`, data),
  deleteProject: (projectId) => api.delete(`/project/${projectId}`),
};
