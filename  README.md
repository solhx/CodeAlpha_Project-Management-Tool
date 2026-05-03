# 🚀 ProFlow — Project Management Tool

A full-stack collaborative project management platform built with Next.js, Node.js, MongoDB, and Socket.io.

---

## ✨ Features

| Feature                     | Status |
|-----------------------------|--------|
| JWT Auth + Refresh Tokens   | ✅     |
| Role-Based Access Control   | ✅     |
| Group Project Management    | ✅     |
| Kanban Boards (dnd-kit)     | ✅     |
| Task CRUD + Assignment       | ✅     |
| Checklists + Labels         | ✅     |
| Comment System + Reactions  | ✅     |
| Real-Time (Socket.io)       | ✅     |
| Notifications System        | ✅     |
| Typing Indicators           | ✅     |
| Online Presence             | ✅     |
| Avatar Upload (Cloudinary)  | ✅     |
| Due Date Reminders (cron)   | ✅     |
| Email Notifications         | ✅     |
| Password Reset Flow         | ✅     |
| Global Search               | ✅     |
| Activity Log                | ✅     |
| Docker + CI/CD              | ✅     |
| Responsive Design           | ✅     |

---

## 🏗️ Tech Stack

**Frontend:** Next.js 14 · Redux Toolkit · RTK Query · Tailwind CSS · dnd-kit · Socket.io Client

**Backend:** Node.js · Express.js · MongoDB · Mongoose · JWT · Socket.io · node-cron

**DevOps:** Docker · GitHub Actions · Cloudinary · Nodemailer · Redis (optional)

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/yourname/proflow && cd proflow

# Backend
cd backend && cp .env.example .env
npm install && npm run dev

# Frontend (new terminal)
cd frontend && cp .env.local.example .env.local
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Seed Demo Data
```bash
cd backend && node src/scripts/seed.js
# admin@proflow.com / Admin1234
# member@proflow.com / Member1234
```

### Docker
```bash
docker-compose up --build
```

---

## 📁 Project Structure

```
proflow/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── config/       # DB, Socket, Cloudinary
│   │   ├── controllers/  # Route handlers (7)
│   │   ├── middlewares/  # Auth, role, validate, error
│   │   ├── models/       # Mongoose schemas (8)
│   │   ├── routes/       # Express routers (7)
│   │   ├── services/     # Email, notifications, upload, scheduler
│   │   ├── sockets/      # Real-time event handlers
│   │   ├── utils/        # ApiResponse, ApiError, asyncHandler
│   │   └── validators/   # express-validator rules
│   └── server.js
│
└── frontend/         # Next.js 14 App
    ├── src/
    │   ├── app/          # Pages (App Router)
    │   ├── components/   # 25+ reusable components
    │   ├── hooks/        # useSocket, useAuth, useDragDrop
    │   ├── lib/          # Axios, Socket singleton, utils
    │   └── store/        # Redux slices + RTK Query APIs
    └── tailwind.config.js
```

---

## 🔐 Authentication Flow

```
Register/Login → Access Token (15m) + Refresh Token (7d, HttpOnly cookie)
     ↓
Request with Bearer token → 401 → Auto-refresh → Retry original request
     ↓
Logout → Clear tokens + cookie
```

---

## ⚡ WebSocket Events

| Event              | Direction       | Description                  |
|--------------------|-----------------|------------------------------|
| `join:board`       | Client → Server | Join board room              |
| `task:created`     ## ⚡ WebSocket Events

| Event                | Direction       | Description                    |
|----------------------|-----------------|--------------------------------|
| `join:board`         | Client → Server | Join board room                |
| `join:project`       | Client → Server | Join project room              |
| `join:task`          | Client → Server | Join task room for typing      |
| `task:created`       | Server → Client | New task broadcast to board    |
| `task:updated`       | Server → Client | Task change broadcast          |
| `task:deleted`       | Server → Client | Task removal broadcast         |
| `task:moved`         | Server → Client | Task column change broadcast   |
| `comment:new`        | Server → Client | New comment on task            |
| `comment:updated`    | Server → Client | Edited comment broadcast       |
| `comment:deleted`    | Server → Client | Deleted comment broadcast      |
| `comment:reaction`   | Server → Client | Emoji reaction update          |
| `notification:new`   | Server → Client | Real-time notification push    |
| `member:online`      | Server → Client | Member joined project          |
| `member:offline`     | Server → Client | Member left / disconnected     |
| `typing:start`       | Client → Server | User started typing comment    |
| `typing:stop`        | Client → Server | User stopped typing            |

---

## 🗄️ Database Indexes

| Collection    | Index                                      | Purpose                    |
|---------------|--------------------------------------------|----------------------------|
| users         | `email` (unique)                           | Fast login lookup          |
| users         | `name, email` (text)                       | Full-text search           |
| tasks         | `board, column, order`                     | Kanban sort performance    |
| tasks         | `assignees`                                | My tasks filter            |
| tasks         | `dueDate`                                  | Scheduler queries          |
| notifications | `recipient, isRead, createdAt`             | Inbox pagination           |
| activity      | `project, createdAt`                       | Activity log pagination    |
| comments      | `task, createdAt`                          | Comment thread load        |

---

## 🌐 API Reference

```
BASE URL: /api/v1

AUTH          POST /auth/register | /auth/login | /auth/logout
              POST /auth/refresh-token | /auth/forgot-password
              PATCH /auth/reset-password/:token

USERS         GET/PATCH /users/me
              PATCH /users/me/avatar | /users/me/password
              GET /users/search?q=

PROJECTS      GET/POST /projects
              GET/PUT/DELETE /projects/:id
              POST /projects/:id/invite
              PATCH/DELETE /projects/:id/members/:userId
              GET /projects/:id/activity

BOARDS        GET/POST /boards
              GET/PUT/DELETE /boards/:id
              POST /boards/:boardId/columns
              PUT/DELETE /boards/:boardId/columns/:columnId
              PATCH /boards/:boardId/columns/reorder

TASKS         GET/POST /tasks
              GET /tasks/my-tasks
              GET/PUT/DELETE /tasks/:id
              PATCH /tasks/:id/move | /tasks/:id/assign
              PATCH /tasks/:id/checklist

COMMENTS      GET/POST /comments
              PUT/DELETE /comments/:id
              POST /comments/:id/reactions

NOTIFICATIONS GET/PATCH /notifications
              GET /notifications/count
              PATCH /notifications/read-all
              PATCH/DELETE /notifications/:id
```

---

## 🚢 Deployment

```bash
# Backend → Railway / Render
railway up

# Frontend → Vercel
vercel --prod

# Database → MongoDB Atlas
# Files    → Cloudinary
# Cache    → Redis Cloud (Upstash)
```

---

## 📄 License

MIT © 2024 ProFlow