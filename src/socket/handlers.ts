import { Socket, Server } from 'socket.io';
import { store, Member } from './store';

export const registerHandlers = (io: Server, socket: Socket) => {
    const userId = (socket as any).userId;

    // --- Handlers ---

    const handleCreateRoom = (
        payload: { roomId?: string } | undefined,
        callback: (res: { roomId?: string; error?: string }) => void
    ) => {
        try {
            // Use provided ID or generate one
            const roomId = payload?.roomId || `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            store.createRoom(roomId, userId);

            // Auto-join creator
            const member: Member = {
                userId,
                socketId: socket.id,
                isAdmin: true,
                joinedAt: Date.now(),
            };
            store.addMember(roomId, member);
            socket.join(roomId);

            callback({ roomId });
        } catch (err: any) {
            callback({ error: err.message });
        }
    };

    const handleJoinRoom = (
        { roomId, peerId }: { roomId: string; peerId?: string },
        callback: (res: { ok: boolean; role?: 'admin' | 'member'; error?: string }) => void
    ) => {
        try {
            const room = store.getRoom(roomId);
            if (!room) {
                return callback({ ok: false, error: 'Room not found' });
            }

            const isAdmin = room.admins.has(userId);
            const member: Member = {
                userId,
                socketId: socket.id,
                isAdmin,
                joinedAt: Date.now(),
                peerId
            };

            store.addMember(roomId, member);
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
        } catch (err: any) {
            callback({ ok: false, error: err.message });
        }
    };

    const handleLeaveRoom = (
        { roomId }: { roomId: string },
        callback: (res: { ok: boolean; error?: string }) => void
    ) => {
        store.removeMember(roomId, socket.id);
        socket.leave(roomId);

        // Notify others
        socket.to(roomId).emit('room:presence', {
            roomId,
            event: 'leave',
            userId,
        });

        if (callback) callback({ ok: true });
    };

    // Generic messaging
    const handleEmit = (
        { roomId, event, payload }: { roomId: string; event: string; payload: any },
        callback: (res: { ok: boolean; error?: string }) => void
    ) => {
        const member = store.getMember(roomId, socket.id);
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

        if (callback) callback({ ok: true });
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
        const allRooms = store.getAllRooms();
        for (const room of allRooms) {
            if (room.members.has(socket.id)) {
                store.removeMember(room.roomId, socket.id);
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
