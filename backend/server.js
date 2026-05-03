// backend/server.js (final complete version)
import express    from 'express';
import http       from 'http';
import cors       from 'cors';
import helmet     from 'helmet';
import morgan     from 'morgan';
import rateLimit  from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import compression   from 'compression';
import dotenv        from 'dotenv';

import connectDB            from './src/config/db.js';
import { initSocket }       from './src/config/socket.js';
import { errorHandler }     from './src/middlewares/error.middleware.js';
import { startScheduler }   from './src/services/scheduler.service.js';

// Routes
import authRoutes         from './src/routes/auth.routes.js';
import userRoutes         from './src/routes/user.routes.js';
import projectRoutes      from './src/routes/project.routes.js';
import boardRoutes        from './src/routes/board.routes.js';
import taskRoutes         from './src/routes/task.routes.js';
import commentRoutes      from './src/routes/comment.routes.js';
import notificationRoutes from './src/routes/notification.routes.js';

dotenv.config();

const app    = express();
const server = http.createServer(app);

// ── Database ──
await connectDB();

// ── Socket.io ──
await initSocket(server);

// ── Security Middleware ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body & Compression ──
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// ── Logging ──
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── Rate Limiting ──
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message:  { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      20,
  message:  { success: false, message: 'Too many auth attempts. Try again in 1 hour.' },
});

app.use('/api/', globalLimiter);

// ── API Routes ──
app.use('/api/v1/auth',          authLimiter,  authRoutes);
app.use('/api/v1/users',                       userRoutes);
app.use('/api/v1/projects',                    projectRoutes);
app.use('/api/v1/boards',                      boardRoutes);
app.use('/api/v1/tasks',                       taskRoutes);
app.use('/api/v1/comments',                    commentRoutes);
app.use('/api/v1/notifications',               notificationRoutes);

// ── Health Check ──
app.get('/health', (req, res) =>
  res.status(200).json({
    status:    'ok',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV,
  })
);

// ── 404 Handler ──
app.use('*', (req, res) =>
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  })
);

// ── Global Error Handler ──
app.use(errorHandler);

// ── Start Cron Scheduler ──
if (process.env.NODE_ENV !== 'test') startScheduler();

// ── Start Server ──
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 ProFlow server running`);
  console.log(`   Port:    ${PORT}`);
  console.log(`   Mode:    ${process.env.NODE_ENV}`);
  console.log(`   API:     http://localhost:${PORT}/api/v1`);
  console.log(`   Health:  http://localhost:${PORT}/health\n`);
});

// ── Unhandled Rejections ──
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export default server;