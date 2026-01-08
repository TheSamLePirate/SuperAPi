# API & Realtime Server Documentation

**Target Audience:** AI Agents (React/Node clients)  
**Protocol:** REST (HTTP) + WebSocket (Socket.IO v4) + WebRTC (PeerJS)  
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
Programmatically create a room.
- **POST** `/v1/rooms`
- **Headers**: `x-api-key: <API_KEY>`
- **Body**: `{ "roomId": "optional-custom-id", "createdBy": "admin-agent-id" }`
- **Response**: `Room` object.

### C. Admin: List Rooms
List all active rooms.
- **GET** `/v1/rooms`
- **Headers**: `x-api-key: <API_KEY>`
- **Response**: Array of `Room` objects.

### D. Emit to Socket Room
Send a socket event to a specific room via HTTP.
- **POST** `/toSocket/:event`
- **Headers**: `x-api-key: <API_KEY>`
- **Body**: `{ "roomId": "target_room_id", "payload": { ... } }`
- **Response**: `{ "success": true, "event": "...", "roomId": "..." }`

### E. In-Memory Store
Simple key-value store for sharing data between agents.

#### Set Data
- **POST** `/memory/:dataName`
- **Headers**: `x-api-key: <API_KEY>`
- **Body**: JSON Data (any valid JSON)
- **Response**: `{ "success": true, "key": "..." }`

#### Get Data
- **GET** `/memory/:dataName`
- **Headers**: `x-api-key: <API_KEY>`
- **Response**: stored JSON data
- **Errors**: `404 Not Found` if key does not exist.

---

## 3. Realtime API (Socket.IO)

**Connection URL**: `http://<HOST>:<PORT>`  
**Transport**: `websocket` suggested.

### Connection
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: { apiKey: "dev-secret-key-123", userId: "agent-007" }
});
```

### Client -> Server Events

#### `room:create`
- **Payload**: `{ "roomId": "optional_id" }`
- **Ack**: `{ "roomId": "..." }`

#### `room:join`
Join a room and optionally announce your PeerJS ID for WebRTC.
- **Payload**: `{ "roomId": "target_room_id", "peerId": "my-peerjs-id" (optional) }`
- **Ack**: `{ "ok": true, "role": "admin" | "member" }`

#### `room:leave`
- **Payload**: `{ "roomId": "target_room_id" }`
- **Ack**: `{ "ok": true }`

#### `room:emit`
Broadcast message to room with optional targeting.
- **Payload**: 
  ```json
  { 
    "roomId": "...", 
    "event": "custom-event", 
    "payload": { ... },
    "sendTo": "allExcludingSender" | "allIncludingSender" | "admin" | "<userId>"
  }
  ```
- **sendTo options** (optional, default: `allExcludingSender`):
  - `allExcludingSender` - Send to all room members except the sender
  - `allIncludingSender` - Send to all room members including the sender
  - `admin` - Send only to admin members in the room
  - `<userId>` - Send only to a specific user by their userId
- **Ack**: `{ "ok": true }` or `{ "ok": false, "error": "User <userId> not found in room" }`

### Server -> Client Events

#### `room:presence`
Triggered when a user joins or leaves.
- **Structure**:
  ```json
  {
    "roomId": "string",
    "event": "join" | "leave",
    "userId": "string",
    "isAdmin": boolean,
    "peerId": "string" (Optional: only if user provided it on join)
  }
  ```

#### `<custom-event-name>` (via `room:emit`)
- **Structure**: `{ "roomId", "from", "event", "payload", "ts" }`

---

## 4. WebRTC (PeerJS)

**PeerServer Endpoint**: `http://<HOST>:<PORT>/peerjs`

### Usage
Clients can use `peerjs` library to establish direct P2P connections.

1. **Connect to PeerServer**:
   ```javascript
   import Peer from 'peerjs';
   const peer = new Peer(undefined, {
     host: 'localhost',
     port: 3000,
     path: '/peerjs'
   });
   
   peer.on('open', (id) => {
     // Now connect to Socket.IO and send this id
     socket.emit('room:join', { roomId: '...', peerId: id });
   });
   ```

2. **Establish Call/Data Connection**:
   - Listen for `room:presence` (event: 'join').
   - Extract `peerId` from the payload.
   - Use `peer.connect(remotePeerId)` or `peer.call(remotePeerId, stream)`.

---

## 5. Types & Data Structures

### Room Object
```typescript
interface Room {
  roomId: string;
  createdAt: number;
  createdBy: string;
  admins: string[];
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
  peerId?: string; // Optional WebRTC ID
}
```
