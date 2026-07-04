import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const socket = io('http://localhost:5000', {
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('online-users', (users) => setOnlineUsers(users));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  const joinWorkspace = (workspaceId) => {
    socketRef.current?.emit('join-workspace', workspaceId);
  };

  const leaveWorkspace = (workspaceId) => {
    socketRef.current?.emit('leave-workspace', workspaceId);
  };

  const joinTask = (taskId) => {
    socketRef.current?.emit('join-task', taskId);
  };

  const leaveTask = (taskId) => {
    socketRef.current?.emit('leave-task', taskId);
  };

  const on = (event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  };

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, connected, onlineUsers, joinWorkspace, leaveWorkspace, joinTask, leaveTask, on }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}