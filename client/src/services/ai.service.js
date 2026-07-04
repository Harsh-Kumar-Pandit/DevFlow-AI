import api from './api';

export const aiService = {
  generateDescription: (title) =>
    api.post('/ai/generate-task-description', { title }),
  suggestPriority: (title, description) =>
    api.post('/ai/suggest-priority', { title, description }),
  breakTask: (task) =>
    api.post('/ai/break-task', { task }),
  projectSummary: (projectId) =>
    api.post('/ai/project-summary', { projectId }),
  sprintSummary: (workspaceId) =>
    api.post('/ai/sprint-summary', { workspaceId }),
  chat: (workspaceId, question) =>
    api.post('/ai/chat', { workspaceId, question }),
};
