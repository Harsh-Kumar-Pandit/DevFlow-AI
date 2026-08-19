import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { workspaceService } from '../services/workspace.service';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { on } = useSocket() || {};
  const { user } = useAuth() || {};

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workspaceService.getMyWorkspaces();
      const list = res.data.workspaces || [];
      setWorkspaces(list);
      // Try to preserve current workspace, or select first
      setCurrentWorkspace((prev) => {
        if (!prev) return list[0] || null;
        const match = list.find((w) => w._id === prev._id);
        return match || list[0] || null;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (!on) return;

    const cleanupJoined = on('MEMBER_JOINED', (payload) => {
      // If current user is the one who joined, or the owner/member of the workspace
      const currentUserId = user?.id || user?._id;
      if (payload.userId === currentUserId || payload.workspaceId === currentWorkspace?._id) {
        fetchWorkspaces();
      }
    });

    const cleanupRejected = on('MEMBER_REJECTED', (payload) => {
      const currentUserId = user?.id || user?._id;
      if (payload.userId === currentUserId) {
        fetchWorkspaces();
      }
    });

    return () => {
      cleanupJoined?.();
      cleanupRejected?.();
    };
  }, [on, user, fetchWorkspaces, currentWorkspace]);

  return (
    <WorkspaceContext.Provider
      value={{ workspaces, currentWorkspace, setCurrentWorkspace, fetchWorkspaces, loading }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
