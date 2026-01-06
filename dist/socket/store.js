"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
class Store {
    constructor() {
        this.rooms = new Map();
        this.memory = new Map();
        this.createRoom('admin-room', 'system');
    }
    createRoom(roomId, createdBy) {
        if (this.rooms.has(roomId)) {
            throw new Error(`Room ${roomId} already exists`);
        }
        const room = {
            roomId,
            createdAt: Date.now(),
            createdBy,
            admins: new Set([createdBy]),
            members: new Map(),
            bannedUserIds: new Set(),
        };
        this.rooms.set(roomId, room);
        return room;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    deleteRoom(roomId) {
        return this.rooms.delete(roomId);
    }
    addMember(roomId, member) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        // Check if banned
        if (room.bannedUserIds.has(member.userId)) {
            throw new Error('User is banned from this room');
        }
        // Check optional simple max members (though socket middleware might handle better)
        // if (room.members.size >= config.ROOM_MAX_MEMBERS) ... 
        room.members.set(member.socketId, member);
    }
    removeMember(roomId, socketId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        room.members.delete(socketId);
        // Auto-delete room if empty?
        if (room.members.size === 0) {
            this.deleteRoom(roomId);
            console.log(`Room ${roomId} deleted (empty)`);
        }
    }
    getMember(roomId, socketId) {
        return this.rooms.get(roomId)?.members.get(socketId);
    }
    getAllRooms() {
        return Array.from(this.rooms.values());
    }
    setMemory(key, value) {
        this.memory.set(key, value);
    }
    getMemory(key) {
        return this.memory.get(key);
    }
}
exports.store = new Store();
