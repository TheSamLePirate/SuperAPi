"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHandlers = void 0;
const store_1 = require("./store");
const registerHandlers = (io, socket) => {
    const userId = socket.userId;
    // --- Handlers ---
    const handleCreateRoom = (payload, callback) => {
        try {
            // Use provided ID or generate one
            const roomId = payload?.roomId || `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            store_1.store.createRoom(roomId, userId);
            // Auto-join creator
            const member = {
                userId,
                socketId: socket.id,
                isAdmin: true,
                joinedAt: Date.now(),
            };
            store_1.store.addMember(roomId, member);
            socket.join(roomId);
            callback({ roomId });
        }
        catch (err) {
            callback({ error: err.message });
        }
    };
    const handleJoinRoom = ({ roomId, peerId }, callback) => {
        try {
            const room = store_1.store.getRoom(roomId);
            if (!room) {
                return callback({ ok: false, error: 'Room not found' });
            }
            const isAdmin = room.admins.has(userId);
            const member = {
                userId,
                socketId: socket.id,
                isAdmin,
                joinedAt: Date.now(),
                peerId
            };
            store_1.store.addMember(roomId, member);
            socket.join(roomId);
            // Notify others
            socket.to(roomId).emit('room:presence', {
                roomId,
                event: 'join',
                userId,
                isAdmin,
                peerId
            });
            callback({ ok: true, role: isAdmin ? 'admin' : 'member' });
        }
        catch (err) {
            callback({ ok: false, error: err.message });
        }
    };
    const handleLeaveRoom = ({ roomId }, callback) => {
        store_1.store.removeMember(roomId, socket.id);
        socket.leave(roomId);
        // Notify others
        socket.to(roomId).emit('room:presence', {
            roomId,
            event: 'leave',
            userId,
        });
        if (callback)
            callback({ ok: true });
    };
    // Generic messaging
    const handleEmit = ({ roomId, event, payload }, callback) => {
        const member = store_1.store.getMember(roomId, socket.id);
        if (!member) {
            return callback({ ok: false, error: 'Not a member of this room' });
        }
        // Broadcast to room (excluding sender)
        // outbound broadcast: { roomId, from: userId, event, payload, ts }
        socket.to(roomId).emit(event, {
            roomId,
            from: userId,
            event,
            payload,
            ts: Date.now(),
        });
        if (callback)
            callback({ ok: true });
    };
    // Cleanup on disconnect
    socket.on('disconnect', () => {
        // Find rooms user is in and remove them
        // Since socket.io automatically removes from rooms on disconnect, we just need to update our store.
        // However, store is organized by Room -> Members. Inspecting all rooms is inefficient but MVP acceptable.
        // Better: Helper in store to removeSocketFromAllRooms, or track rooms on socket.
        // Optimisation: use store.getAllRooms() and check members.
        // Ideally we would track joined rooms on the socket or user session, but socket.rooms is cleared on disconnect.
        // We'll iterate for MVP.
        const allRooms = store_1.store.getAllRooms();
        for (const room of allRooms) {
            if (room.members.has(socket.id)) {
                store_1.store.removeMember(room.roomId, socket.id);
                io.to(room.roomId).emit('room:presence', {
                    roomId: room.roomId,
                    event: 'leave',
                    userId,
                });
            }
        }
        console.log(`User ${userId} disconnected (${socket.id})`);
    });
    // --- Register Events ---
    socket.on('room:create', handleCreateRoom);
    socket.on('room:join', handleJoinRoom);
    socket.on('room:leave', handleLeaveRoom);
    socket.on('room:emit', handleEmit);
};
exports.registerHandlers = registerHandlers;
