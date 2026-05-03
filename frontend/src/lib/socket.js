// frontend/src/lib/socket.js
import { io } from 'socket.io-client';

let socket = null;

export const getSocket = (token) => {
  if (!socket && token) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      auth:           { token },
      transports:     ['websocket'],
      reconnection:   true,
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
      timeout:        20000,
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const reconnectSocket = (token) => {
  disconnectSocket();
  return getSocket(token);
};