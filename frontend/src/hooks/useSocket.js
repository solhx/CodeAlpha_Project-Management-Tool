// frontend/src/hooks/useSocket.js (final complete version)
import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch }       from 'react-redux';
import { selectAccessToken, selectIsAuthenticated } from '@/store/slices/authSlice';
import { notificationApi }  from '@/store/api/notificationApi';
import { commentApi }       from '@/store/api/commentApi';
import { boardApi }         from '@/store/api/boardApi';
import {
  addOnlineMember,
  removeOnlineMember,
} from '@/store/slices/boardSlice';
import { incrementUnread, addNotification } from '@/store/slices/notificationSlice';
import { io }               from 'socket.io-client';

let socketSingleton = null;

export const useSocket = () => {
  const accessToken     = useSelector(selectAccessToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dispatch        = useDispatch();
  const socketRef       = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    // ✅ FIX: Destroy and recreate socket if token changed (e.g. after refresh)
    if (socketSingleton && socketSingleton.auth?.token !== accessToken) {
      socketSingleton.disconnect();
      socketSingleton = null;
    }

    if (!socketSingleton) {
      socketSingleton = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
        auth                : { token: accessToken },
        transports          : ['websocket'],
        reconnection        : true,
        reconnectionAttempts: 5,
        reconnectionDelay   : 1000,
        reconnectionDelayMax: 5000,
        timeout             : 20000,
      });
    }

    socketRef.current = socketSingleton;

    // ── Connection Events ──────────────────────────────────────────────────
    const onConnect = () => {
      console.log('🟢 Socket connected:', socketSingleton.id);
    };

    const onDisconnect = (reason) => {
      console.log('🔴 Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        socketSingleton.connect();
      }
    };

    const onConnectError = (err) => {
      console.error('Socket connection error:', err.message);
    };

    // ── Notification Events ────────────────────────────────────────────────
    const onNotificationNew = (data) => {
      dispatch(notificationApi.util.invalidateTags(['Notification']));
      dispatch(incrementUnread());
      if (data.notification) dispatch(addNotification(data.notification));

      // Browser push notification
      if (typeof window !== 'undefined' && Notification?.permission === 'granted') {
        new Notification('ProFlow', {
          body : data.notification?.message,
          icon : '/favicon.ico',
          badge: '/badge-icon.png',
          tag  : data.notification?._id,
        });
      }
    };

    // ── Task Events ────────────────────────────────────────────────────────
    // All task socket events invalidate the boardApi cache so KanbanBoard
    // refetches and re-renders with the latest data automatically.

    const onTaskCreated = ({ task }) => {
      const boardId = task?.board?._id || task?.board;
      if (boardId) {
        dispatch(boardApi.util.invalidateTags([{ type: 'Board', id: boardId }]));
      }
    };

    const onTaskUpdated = ({ task }) => {
      const boardId = task?.board?._id || task?.board;
      if (boardId) {
        dispatch(boardApi.util.invalidateTags([{ type: 'Board', id: boardId }]));
      }
    };

    const onTaskDeleted = ({ taskId, boardId: bId }) => {
      if (bId) {
        dispatch(boardApi.util.invalidateTags([{ type: 'Board', id: bId }]));
      } else {
        dispatch(boardApi.util.invalidateTags(['Board']));
      }
    };

    const onTaskMoved = ({ boardId: bId }) => {
      if (bId) {
        dispatch(boardApi.util.invalidateTags([{ type: 'Board', id: bId }]));
      } else {
        dispatch(boardApi.util.invalidateTags(['Board']));
      }
    };

    // ── Comment Events ─────────────────────────────────────────────────────
    const onCommentNew      = () => dispatch(commentApi.util.invalidateTags(['Comment']));
    const onCommentUpdated  = () => dispatch(commentApi.util.invalidateTags(['Comment']));
    const onCommentDeleted  = () => dispatch(commentApi.util.invalidateTags(['Comment']));
    const onCommentReaction = () => dispatch(commentApi.util.invalidateTags(['Comment']));

    // ── Presence Events ────────────────────────────────────────────────────
    const onMemberOnline  = ({ user })   => dispatch(addOnlineMember(user));
    const onMemberOffline = ({ userId }) => dispatch(removeOnlineMember(userId));

    // ── Register Listeners ─────────────────────────────────────────────────
    socketSingleton.on('connect',          onConnect);
    socketSingleton.on('disconnect',       onDisconnect);
    socketSingleton.on('connect_error',    onConnectError);
    socketSingleton.on('notification:new', onNotificationNew);
    socketSingleton.on('task:created',     onTaskCreated);
    socketSingleton.on('task:updated',     onTaskUpdated);
    socketSingleton.on('task:deleted',     onTaskDeleted);
    socketSingleton.on('task:moved',       onTaskMoved);
    socketSingleton.on('comment:new',      onCommentNew);
    socketSingleton.on('comment:updated',  onCommentUpdated);
    socketSingleton.on('comment:deleted',  onCommentDeleted);
    socketSingleton.on('comment:reaction', onCommentReaction);
    socketSingleton.on('member:online',    onMemberOnline);
    socketSingleton.on('member:offline',   onMemberOffline);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      socketSingleton?.off('connect',          onConnect);
      socketSingleton?.off('disconnect',       onDisconnect);
      socketSingleton?.off('connect_error',    onConnectError);
      socketSingleton?.off('notification:new', onNotificationNew);
      socketSingleton?.off('task:created',     onTaskCreated);
      socketSingleton?.off('task:updated',     onTaskUpdated);
      socketSingleton?.off('task:deleted',     onTaskDeleted);
      socketSingleton?.off('task:moved',       onTaskMoved);
      socketSingleton?.off('comment:new',      onCommentNew);
      socketSingleton?.off('comment:updated',  onCommentUpdated);
      socketSingleton?.off('comment:deleted',  onCommentDeleted);
      socketSingleton?.off('comment:reaction', onCommentReaction);
      socketSingleton?.off('member:online',    onMemberOnline);
      socketSingleton?.off('member:offline',   onMemberOffline);
    };
  }, [isAuthenticated, accessToken, dispatch]);

  // ── Room Actions ───────────────────────────────────────────────────────────
  const joinProject  = useCallback((id) => socketRef.current?.emit('join:project',  id), []);
  const leaveProject = useCallback((id) => socketRef.current?.emit('leave:project', id), []);
  const joinBoard    = useCallback((id) => socketRef.current?.emit('join:board',    id), []);
  const leaveBoard   = useCallback((id) => socketRef.current?.emit('leave:board',   id), []);
  const joinTask     = useCallback((id) => socketRef.current?.emit('join:task',     id), []);
  const leaveTask    = useCallback((id) => socketRef.current?.emit('leave:task',    id), []);

  const emitTypingStart = useCallback(
    (taskId) => socketRef.current?.emit('typing:start', { taskId }), []
  );
  const emitTypingStop = useCallback(
    (taskId) => socketRef.current?.emit('typing:stop',  { taskId }), []
  );

  return {
    socket      : socketRef.current,
    isConnected : socketRef.current?.connected || false,
    joinProject,  leaveProject,
    joinBoard,    leaveBoard,
    joinTask,     leaveTask,
    emitTypingStart,
    emitTypingStop,
  };
};

export const destroySocket = () => {
  if (socketSingleton) {
    socketSingleton.disconnect();
    socketSingleton = null;
  }
};