// backend/src/config/socket.js (production version with Redis adapter)
import { Server }        from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient }  from 'redis';
import jwt               from 'jsonwebtoken';
import User              from '../models/User.model.js';

let io;

export const initSocket = async (server) => {
  io = new Server(server, {
    cors: {
      origin:      process.env.CLIENT_URL,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
    transports:   ['websocket', 'polling'],
  });

  // ── Redis Adapter (for multi-instance horizontal scaling) ──
  if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    try {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Socket.io Redis adapter connected');

      pubClient.on('error', (err) => console.error('Redis pub error:', err));
      subClient.on('error', (err) => console.error('Redis sub error:', err));
    } catch (err) {
      console.warn('⚠️  Redis unavailable, using in-memory adapter:', err.message);
    }
  }

  // ── JWT Auth Middleware ──
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('_id name avatar email');
      if (!user)    return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection Handler ──
  io.on('connection', (socket) => {
    console.log(`🟢 ${socket.user.name} connected [${socket.id}]`);

    // Personal room
    socket.join(`user:${socket.user._id}`);

    // ── Room Management ──
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('member:online', {
        user: {
          _id:    socket.user._id,
          name:   socket.user.name,
          avatar: socket.user.avatar,
        },
      });
    });

    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('member:offline', {
        userId: socket.user._id,
      });
    });

    socket.on('join:board',  (boardId) => socket.join(`board:${boardId}`));
    socket.on('leave:board', (boardId) => {
      socket.leave(`board:${boardId}`);
    });

    socket.on('join:task',  (taskId) => socket.join(`task:${taskId}`));
    socket.on('leave:task', (taskId) => socket.leave(`task:${taskId}`));

    // ── Typing Indicators ──
    socket.on('typing:start', ({ taskId }) => {
      socket.to(`task:${taskId}`).emit('typing:start', {
        user: { _id: socket.user._id, name: socket.user.name, avatar: socket.user.avatar },
        taskId,
      });
    });

    socket.on('typing:stop', ({ taskId }) => {
      socket.to(`task:${taskId}`).emit('typing:stop', {
        userId: socket.user._id,
        taskId,
      });
    });

    // ── Cursor Presence (optional real-time collaboration) ──
    socket.on('cursor:move', ({ boardId, x, y }) => {
      socket.to(`board:${boardId}`).emit('cursor:move', {
        userId: socket.user._id,
        name:   socket.user.name,
        x, y,
      });
    });

    // ── Disconnect ──
    socket.on('disconnect', (reason) => {
      console.log(`🔴 ${socket.user.name} disconnected — ${reason}`);

      // Notify all project rooms this user was in
      socket.rooms.forEach((room) => {
        if (room.startsWith('project:')) {
          socket.to(room).emit('member:offline', { userId: socket.user._id });
        }
      });
    });

    // ── Error ──
    socket.on('error', (err) => {
      console.error(`Socket error [${socket.user.name}]:`, err.message);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket() first.');
  return io;
};

// Broadcast helpers
export const emitToUser    = (userId, event, data) => getIO().to(`user:${userId}`).emit(event, data);
export const emitToBoard   = (boardId, event, data) => getIO().to(`board:${boardId}`).emit(event, data);
export const emitToProject = (projectId, event, data) => getIO().to(`project:${projectId}`).emit(event, data);
export const emitToTask    = (taskId, event, data) => getIO().to(`task:${taskId}`).emit(event, data);