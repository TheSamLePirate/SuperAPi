export interface Member {
    userId: string;
    socketId: string;
    isAdmin: boolean;
    joinedAt: number;
    peerId?: string;
}

export interface Room {
    roomId: string;
    createdAt: number;
    createdBy: string;
    admins: Set<string>; // Set of userIds
    members: Map<string, Member>; // Map<socketId, Member>
    bannedUserIds: Set<string>;
}

class Store {
    private rooms: Map<string, Room> = new Map();
    private memory: Map<string, any> = new Map();

    createRoom(roomId: string, createdBy: string): Room {
        if (this.rooms.has(roomId)) {
            throw new Error(`Room ${roomId} already exists`);
        }

        const room: Room = {
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

    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    deleteRoom(roomId: string): boolean {
        return this.rooms.delete(roomId);
    }

    addMember(roomId: string, member: Member): void {
        const room = this.rooms.get(roomId);
        if (!room) return;

        // Check if banned
        if (room.bannedUserIds.has(member.userId)) {
            throw new Error('User is banned from this room');
        }

        // Check optional simple max members (though socket middleware might handle better)
        // if (room.members.size >= config.ROOM_MAX_MEMBERS) ... 

        room.members.set(member.socketId, member);
    }

    removeMember(roomId: string, socketId: string): void {
        const room = this.rooms.get(roomId);
        if (!room) return;
        room.members.delete(socketId);

        // Auto-delete room if empty?
        if (room.members.size === 0) {
            this.deleteRoom(roomId);
            console.log(`Room ${roomId} deleted (empty)`);
        }
    }

    getMember(roomId: string, socketId: string): Member | undefined {
        return this.rooms.get(roomId)?.members.get(socketId);
    }

    getAllRooms(): Room[] {
        return Array.from(this.rooms.values());
    }

    setMemory(key: string, value: any): void {
        this.memory.set(key, value);
    }

    getMemory(key: string): any {
        return this.memory.get(key);
    }
}

export const store = new Store();
