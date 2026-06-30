import { useEffect } from 'react';
import { useAppSelector } from '@/app/store';
import { connect, disconnect } from '@/services/websocket';
import { queryClient } from '@/app/providers/queryClient';

export const useWebSocket = () => {
  const { accessToken, isAuthenticated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = connect(accessToken);

    socket.on('notification', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    });

    socket.on('dashboard:stats', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    });

    return () => { disconnect(); };
  }, [isAuthenticated, accessToken]);
};
