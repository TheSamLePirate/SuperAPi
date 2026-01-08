# AGENTS.md - Coding Agent Instructions for SuperAPi

This document provides essential information for AI coding agents working in this codebase.

## Project Overview

SuperAPi is a real-time communication server providing:
- REST API for admin operations (Express 5.x)
- Socket.IO for real-time WebSocket communication
- PeerJS integration for WebRTC peer-to-peer connections
- React admin dashboard for monitoring

## Project Structure

```
SuperAPi/
├── src/                    # Backend server (Node.js/TypeScript)
│   ├── index.ts            # Entry point - HTTP, Socket.IO, PeerJS init
│   ├── config.ts           # Environment configuration
│   ├── http/               # Express HTTP layer
│   │   ├── app.ts          # Express app setup with middleware
│   │   ├── routes.ts       # REST API routes
│   │   └── middleware.ts   # Auth and monitoring middleware
│   └── socket/             # Socket.IO layer
│       ├── index.ts        # Socket.IO initialization
│       ├── auth.ts         # Socket authentication middleware
│       ├── handlers.ts     # Socket event handlers
│       └── store.ts        # In-memory room/member store
├── dashboard/              # React admin dashboard (Vite + TypeScript)
│   ├── src/
│   │   ├── App.tsx         # Main dashboard component
│   │   └── main.tsx        # React entry point
├── dist/                   # Compiled backend output
├── docker-compose.yml      # Multi-service Docker setup
└── API_DOCUMENTATION.md    # API and Socket.IO documentation
```

## Build/Lint/Test Commands

### Backend (Root `/`)

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript (`tsc`) |
| `npm run start` | Run production server (`node dist/index.js`) |
| `npm run dev` | Dev server with hot reload (`nodemon src/index.ts`) |

**Note:** No test framework configured. No ESLint configured for backend.

### Dashboard (`/dashboard`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production (`tsc -b && vite build`) |
| `npm run lint` | Run ESLint (`eslint .`) |
| `npm run preview` | Preview production build |

### Docker

```bash
docker-compose up           # Start api and dashboard services
docker-compose up --build   # Rebuild and start
```

## TypeScript Configuration

### Backend (`/tsconfig.json`)
- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- `esModuleInterop: true` for default imports

### Dashboard (`/dashboard/tsconfig.app.json`)
- Target: ES2022
- Module: ESNext with bundler resolution
- Strict mode with `noUnusedLocals`, `noUnusedParameters`
- `verbatimModuleSyntax: true`

## Code Style Guidelines

### Import Style

**Backend (CommonJS with esModuleInterop):**
```typescript
// Named imports preferred
import { Server, Socket } from 'socket.io';
import { Request, Response, NextFunction } from 'express';

// Default imports for packages
import express from 'express';

// Relative paths without extensions
import { config } from '../config';
import { store, Member } from './store';
```

**Dashboard (ESM):**
```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | lowercase, simple names | `handlers.ts`, `store.ts` |
| Variables/Functions | camelCase | `handleCreateRoom`, `fetchRooms` |
| Classes | PascalCase | `Store`, `Member` |
| Interfaces | PascalCase | `Member`, `Room`, `ApiLog` |
| Config properties | camelCase | `config.API_KEY`, `config.PORT` |
| React components | PascalCase | `StatCard`, `App` |

### Error Handling

**Try-catch with typed error:**
```typescript
try {
    const room = store.createRoom(roomId, createdBy);
    res.json(room);
} catch (err: any) {
    res.status(409).json({ error: err.message });
}
```

**Socket handlers with callback:**
```typescript
const handleJoinRoom = (
    { roomId, peerId }: { roomId: string; peerId?: string },
    callback: (res: { ok: boolean; role?: 'admin' | 'member'; error?: string }) => void
) => {
    try {
        // ... logic
        if (callback) callback({ ok: true, role: isAdmin ? 'admin' : 'member' });
    } catch (err: any) {
        if (callback) callback({ ok: false, error: err.message });
    }
};
```

### Express Middleware Pattern

```typescript
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== config.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key' });
    }
    next();
};
```

### Socket.IO Handler Pattern

```typescript
// Handler registration
socket.on('room:create', handleCreateRoom);
socket.on('room:join', handleJoinRoom);

// Handler with acknowledgment callback
const handleCreateRoom = (
    payload: { roomId?: string } | undefined,
    callback: (res: { roomId?: string; error?: string }) => void
) => { /* implementation */ };
```

### Type Usage

- Use interfaces for data structures (`Member`, `Room`)
- Inline type annotations for function parameters
- `any` type acceptable for flexible payloads and error catching
- Type assertions with `as any` for extending Socket objects
- Optional properties with `?` syntax (`peerId?: string`)

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `API_KEY` | **Yes** | - | Authentication key |
| `MAX_HTTP_BUFFER_SIZE` | No | `1mb` | Max request body size |
| `ROOM_MAX_MEMBERS` | No | `100` | Max members per room |

Dashboard:
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (build-time) |

## Key Dependencies

### Backend
- `express` (5.x) - Web framework
- `socket.io` (4.x) - WebSocket server
- `peer` (1.x) - PeerJS server for WebRTC
- `cors`, `dotenv` - Middleware utilities

### Dashboard
- `react` (19.x) - UI framework
- `socket.io-client` (4.x) - WebSocket client
- `tailwindcss` (4.x) - CSS framework
- `lucide-react` - Icon library

## Important Notes

1. **No test framework** - Tests are not configured; add as needed
2. **No backend linting** - ESLint only configured for dashboard
3. **In-memory store** - Data is not persisted; all state is in-memory
4. **API docs** - See `API_DOCUMENTATION.md` for REST and Socket.IO endpoints
5. **Node.js 20** - Docker uses Node.js 20 Alpine base image
