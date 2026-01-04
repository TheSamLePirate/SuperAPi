# API & Realtime Server Documentation

**Target Audience:** AI Agents (React/Node clients)  
**Protocol:** REST (HTTP) + WebSocket (Socket.IO v4)  
**Auth Strategy:** API Key

---

## 1. Authentication & Configuration

### Global Headers / Auth
- **REST**: Header `x-api-key: <YOUR_API_KEY>`
- **Socket.IO**: Handshake Auth object `{ apiKey: "<YOUR_API_KEY>", userId: "<UNIQUE_USER_ID>" }`

### Environment Variables (Server)
- `PORT`: Server port (default: 3000)
- `API_KEY`: Secret key for authentication
- `MAX_HTTP_BUFFER_SIZE`: e.g., `1mb`

---

## 2. REST API

**Base URL**: `http://<HOST>:<PORT>`

### A. Health Check
Checks if the server is running.
- **GET** `/healthz`
- **Response**: `{ "ok": true }`

### B. Admin: Create Room
Programmatically create a room (useful for setting up contexts before agents join).
- **POST** `/v1/rooms`
- **Headers**: `x-api-key: <API_KEY>`
- **Body**:
  ```json
  {
    "roomId": "optional-custom-id",
    "createdBy": "admin-agent-id"
  }
  ```
- **Response (200)**: returns `Room` object.
- **Response (409)**: Room already exists.

### C. Admin: List Rooms
List all active rooms and their metadata.
- **GET** `/v1/rooms`
- **Headers**: `x-api-key: <API_KEY>`
- **Response (200)**: Array of `Room` objects (mapped for JSON).

---

## 3. Realtime API (Socket.IO)

**Connection URL**: `http://<HOST>:<PORT>`  
**Transport**: `websocket` suggested.

### Connection
To connect, you **MUST** provide `apiKey` and `userId`.

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    apiKey: "dev-secret-key-123",
    userId: "agent-007"
  }
});
```

### Client -> Server Events (Emitters)

#### `room:create`
Create a new room. The creator is automatically joined as an admin.
- **Payload**: `{ "roomId": "optional_id" }` (if empty, server generates one)
- **Ack Callback**: 
  - Success: `{ "roomId": "..." }`
  - Error: `{ "error": "message" }`

#### `room:join`
Join an existing room.
- **Payload**: `{ "roomId": "target_room_id" }`
- **Ack Callback**:
  - Success: `{ "ok": true, "role": "admin" | "member" }`
  - Error: `{ "ok": false, "error": "message" }`

#### `room:leave`
Leave a room.
- **Payload**: `{ "roomId": "target_room_id" }`
- **Ack Callback**: `{ "ok": true }`

#### `room:emit`
Broadcast a generic message to all other members in the room.
- **Payload**: 
  ```json
  {
    "roomId": "target_room_id",
    "event": "custom-event-name",
    "payload": { "any": "json", "data": 123 } 
  }
  ```
- **Ack Callback**: `{ "ok": true }` (or error)

---

### Server -> Client Events (Listeners)

#### `room:presence`
Triggered when a user joins or leaves a room you are in.
- **Structure**:
  ```json
  {
    "roomId": "string",
    "event": "join" | "leave",
    "userId": "string",
    "isAdmin": boolean (only present on 'join')
  }
  ```

#### `<custom-event-name>` (via `room:emit`)
When another user calls `room:emit`, you receive the event name specified there.
- **Structure (Message Envelope)**:
  ```json
  {
    "roomId": "string",
    "from": "sender_user_id",
    "event": "custom-event-name",
    "payload": { ... }, 
    "ts": 1678900000000 (timestamp)
  }
  ```

---

## 4. Types & Data Structures

### Room Object
```typescript
interface Room {
  roomId: string;
  createdAt: number;
  createdBy: string;
  admins: string[]; // Array of userIds
  members: Member[];
  bannedUserIds: string[];
}
```

### Member Object
```typescript
interface Member {
  userId: string;
  socketId: string;
  isAdmin: boolean;
  joinedAt: number;
}
```

## 5. Agent Interaction Workflow Example

1. **Connect**: Initialize Socket.IO with credentials.
2. **Setup**: Agent A calls `room:create` -> gets `roomId`.
3. **Share**: Agent A shares `roomId` with Agent B (via external channel or predefined ID).
4. **Join**: Agent B calls `room:join` with `roomId`.
   - Agent A receives `room:presence` (event: 'join', userId: 'Agent B').
5. **Communicate**: 
   - Agent B emits `room:emit` { event: 'task_update', payload: { status: 'ready' } }.
   - Agent A receives 'task_update' with wrapper including `from: 'Agent B'`.
6. **Cleanup**: Agents call `room:leave` or disconnect. Room auto-deletes when empty.
