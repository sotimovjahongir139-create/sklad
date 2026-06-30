import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@/constants';

let socket: Socket | null = null;

export const connect = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(WS_URL || window.location.origin, {
    auth: { token },
    transports: ['websocket'],
  });

  return socket;
};

export const disconnect = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;
