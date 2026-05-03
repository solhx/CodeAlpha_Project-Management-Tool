// frontend/src/hooks/useNotifications.js
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSocket } from './useSocket';
import { notificationApi } from '@/store/api/notificationApi';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('notification:new', (data) => {
      // Invalidate and refetch notifications
      dispatch(notificationApi.util.invalidateTags(['Notification']));

      // Show browser notification if permission granted
      if (Notification.permission === 'granted' && data.notification) {
        new Notification('ProFlow', {
          body: data.notification.message,
          icon: '/logo.png',
          badge: '/badge.png',
        });
      }
    });

    return () => socket.off('notification:new');
  }, [socket, dispatch]);

  const requestPermission = async () => {
    if ('Notification' in window) {
      await Notification.requestPermission();
    }
  };

  return { requestPermission };
};